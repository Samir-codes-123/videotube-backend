import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(400, "Invalid Channel Id");
  const stats = await User.aggregate([
    {
      $match: {
        $and: [{ _id: new mongoose.Types.ObjectId(channelId) }],
      },
    },
    // total videos
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "myVideos",
        pipeline: [
          {
            $project: {
              views: 1,
              thumbnail: 1,
              title: 1,
              isPublished: 1,
            },
          },
        ],
      },
    },
    // total subscribers
    {
      $lookup: {
        from: "subscribtions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        Videocount: {
          $size: "$myVideos",
        },
      },
    },
  ]);
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId))
    throw new ApiError(400, "Invalid Channel Id");
  const totalVideos = await Video.find({
    owner: new mongoose.Types.ObjectId(channelId),
    isPublished: true,
  });
  if (!totalVideos)
    return res.status(404).json(404, null, "User has no videos");
  return res
    .status(200)
    .json(
      new ApiResponse(200, totalVideos, "User videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
