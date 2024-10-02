import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content.trim()) {
    throw new ApiError(400, "Provide tweet before submitting");
  }
  const user = req.user?._id;
  if (!user) {
    throw new ApiError(403, "Unauthorized permission");
  }
  const response = await Tweet.create({
    owner: user,
    content,
  });
  if (!response) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, response, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  const response = await Tweet.find({
    owner: userId,
  });
  if (response.length === 0) {
    return res.status(200).json(new ApiResponse(200, {}, "User has no tweets"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, "User's tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(404, "Tweet not found");
  }
  if (!content.trim()) {
    throw new ApiError(400, "Please send a valid tweet");
  }
  const response = await Tweet.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(tweetId),
      owner: req.user?._id,
    },
    {
      $set: { content },
    },
    { new: true }
  );
  if (!response) {
    throw new ApiError(404, "Tweet not found or not authorized to update");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(404, "No tweet found");
  }

  // Attempt to delete the tweet
  const response = await Tweet.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(tweetId),
    owner: req.user?._id, // Ensure the tweet belongs to the authenticated user
  });

  // If no tweet is found, throw an error
  if (!response) {
    throw new ApiError(404, "Tweet not found or not authorized to delete");
  }

  // Return a success message
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
