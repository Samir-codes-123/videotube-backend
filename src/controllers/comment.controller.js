import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video");
  }
  //  matcht the video since video will be string convert it into objectid
  const pipeline = [
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
  ];
  // options for pagination
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabels: {
      totalDocs: "totalComments",
      docs: "docs",
    },
  };
  const response = await Comment.aggregatePaginate(pipeline, options);
  console.log(response);

  if (response.totalComments === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { comments: [], totalComments: 0 },
          "No comments found"
        )
      );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video");
  }
  if (!content.trim()) {
    throw new ApiError(400, "Please add a comment");
  }
  const response = await Comment.create({
    content,
    video: mongoose.Types.ObjectId(videoId), // Ensure it's an ObjectId
    owner: req.user?._id, // from jwt middleware
  });

  //const newCommnet = await Comment.findById(response._id);
  if (!response) {
    throw new ApiError(500, "Something went wrong while making new comment");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, response, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  if (!content.trim()) {
    throw new ApiError(400, "New comment is required");
  }
  const newComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: req.user?._id,
    },
    {
      $set: { content },
    },
    { new: true }
  );
  if (!newComment) {
    throw new ApiError(404, "Comment not found or not authorized to update");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment updated successfully"));
});

// TODO: delete a comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // Attempt to delete the comment
  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user?._id, // Ensure the comment belongs to the authenticated user
  });

  // If no comment is found, throw an error
  if (!deletedComment) {
    throw new ApiError(404, "Comment not found or not authorized to delete");
  }

  // Return a success message
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
