import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { response } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = 1,
    userId = "",
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const filter = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      // regex for finding the any video similar to query like hello then all video containing hello will come
      // options for case insensitive abc or Abc or AbC
      { description: { $regex: query, $options: "i" } },
    ],
  };
  if (mongoose.isValidObjectId(userId)) {
    filter.owner = userId;
  }
  const videos = await Video.find(filter)
    .populate({
      // add data from related another data model (user)
      path: "owner", // where to keep
      select: "fullName avatar username", // what to select
    })
    .sort({ [sortBy]: sortType }) // sort document by createdAt at ascending order
    .skip((page - 1) * limit) // if page is two then it will skip 1*10(limit) documents
    .limit(limit); // number of document for a page

  // count number of videos
  const totalVideos = await Video.countDocuments(filter);

  if (videos.length === 0) {
    return res.status(404).json(new ApiResponse(404, {}, "No Videos Found"));
  }

  const result = { totalVideos, videos };
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));

  //   let pipeline = [
  //     {
  //         $match: {
  //             $and: [
  //                 {
  //                     // 2.1 match the videos based on title and description
  //                     $or: [
  //                         { title: { $regex: query, $options: "i" } },   // $regex: is used to search the string in the title "this is first video" => "first"  // i is for case-insensitive
  //                         { description: { $regex: query, $options: "i" } }
  //                     ]
  //                 },
  //                 // 2.2 match the videos based on userId=Owner
  //                 ...( userId ? [ { Owner: new mongoose.Types.ObjectId( userId ) } ] : "" )  // if userId is present then match the Owner field of video
  //                 // new mongoose.Types.ObjectId( userId ) => convert userId to ObjectId
  //             ]
  //         }
  //     },
  //     // 3. lookup the Owner field of video and get the user details
  //     {   // from user it match the _id of user with Owner field of video and saved as Owner
  //         $lookup: {
  //             from: "users",
  //             localField: "Owner",
  //             foreignField: "_id",
  //             as: "Owner",
  //             pipeline: [  // project the fields of user in Owner
  //                 {
  //                     $project: {
  //                         _id: 1,
  //                         fullName: 1,
  //                         avatar: "$avatar.url",
  //                         username: 1,
  //                     }
  //                 }
  //             ]
  //         }
  //     },
  //     {
  //         // 4. addFields just add the Owner field to the video document
  //         $addFields: {
  //             Owner: {
  //                 $first: "$Owner",  // $first: is used to get the first element of Owner array
  //             },
  //         },
  //     },
  //     {
  //         $sort: { [ sortBy ]: sortType }  // sort the videos based on sortBy and sortType
  //     }
  // ];

  // try
  // {
  //     // 5. set options for pagination
  //     const options = {  // options for pagination
  //         page: parseInt( page ),
  //         limit: parseInt( limit ),
  //         customLabels: {   // custom labels for pagination
  //             totalDocs: "totalVideos",
  //             docs: "videos",
  //         },
  //     };

  //     // 6. get the videos based on pipeline and options
  //     const result = await Video.aggregatePaginate( Video.aggregate( pipeline ), options );  // Video.aggregate( pipeline ) find the videos based on pipeline(query, sortBy, sortType, userId). // aggregatePaginate is used for pagination (page, limit)
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All field are required");
  }
  // TODO: get video, upload to cloudinary, create video
  const videoFilePath = await req?.files?.videoFile[0]?.path;
  const thumbnailPath = await req?.files?.thumbnail[0]?.path;

  if (!videoFilePath) {
    throw new ApiError(404, "video File not found");
  }
  if (!thumbnailPath) {
    throw new ApiError(404, "thumbnail not found");
  }

  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  if (!videoFile) {
    throw new ApiError(500, "Error while uploading the video");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Error while uploading the thumbnail");
  }

  const response = await Video.create({
    videoFile: videoFile.url,
    isPublished: true,
    duration: videoFile.duration,
    thumbnail: thumbnail.url,
    title,
    description,
    owner: req.user?._id,
  });
  if (!response) {
    throw new ApiError(500, "Something went wrong while uploading the video");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, response, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video");
  }
  const response = await Video.findById(videoId); // mongoose converts it into objectid
  if (!response) {
    throw new ApiError(404, "video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, "video found successfully"));
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate the video ID
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const { title, description } = req.body;

  // Find the video and ensure the user is the owner
  const video = await Video.findOne({
    _id: videoId, // Mongoose automatically converts to ObjectId
    owner: req.user?._id, // Ensure ownership of the video
  });

  if (!video) {
    throw new ApiError(404, "No video found or not authorized to update");
  }

  // Handle thumbnail upload
  let thumbnailUrl = video.thumbnail; // Default to current thumbnail
  if (req?.files?.thumbnail?.length > 0) {
    const thumbnailPath = req.files.thumbnail[0].path;

    try {
      // Upload the new thumbnail to Cloudinary
      const newThumbnail = await uploadOnCloudinary(thumbnailPath);
      thumbnailUrl = newThumbnail.url;

      // Delete the old thumbnail from Cloudinary
      if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image");
      }
    } catch (error) {
      throw new ApiError(500, "Error while updating thumbnail");
    }
  }

  // Update the video details if provided
  if (title) video.title = title;
  if (description) video.description = description;

  // Always set the thumbnail (either new or existing)
  video.thumbnail = thumbnailUrl;

  // Save the updated video
  await video.save();

  // Send a success response with the updated video
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const filter = {
    _id: new mongoose.Types.ObjectId(videoId),
    owner: req.user?._id,
  };
  const response = await Video.findOne(filter);
  if (!response) {
    throw new ApiError(404, "No video found");
  }
  const deleteVideo = await deleteFromCloudinary(response.videoFile, "video");
  const deleteThumb = await deleteFromCloudinary(response.thumbnail, "image");
  if (!deleteThumb)
    throw new ApiError(500, "Error on deleting thumbnail from cloudinary");
  if (!deleteVideo)
    throw new ApiError(500, "Error on deleting video from cloudinary");
  const deleteData = await Video.deleteOne(filter);
  if (!deleteData) throw new ApiError(500, "Error on deleting video from db");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const filter = {
    _id: new mongoose.Types.ObjectId(videoId),
    owner: req.user?._id,
  };
  const response = await Video.findOneAndUpdate(
    filter,
    { $set: { isPublished: !isPublished } },
    { new: true }
  );
  if (!response)
    throw new ApiError(500, "Error while updating the published button");
  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Published status updated successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
