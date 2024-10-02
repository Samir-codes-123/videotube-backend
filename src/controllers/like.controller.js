import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!mongoose.isValidObjectId(videoId))
    throw new ApiError(400, "Invalid video");
  const response = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });
  // if no liked video is there then create
  if (!response) {
    const newLikedVideo = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });
    console.log(newLikedVideo);
    if (!newLikedVideo)
      throw new ApiError(500, "Something went wrong while liking the video");
    return res
      .status(200)
      .json(new ApiResponse(200, newLikedVideo, "Video liked successfully"));
  }
  const deleteLikedVideo = await Like.deleteOne({
    _id: new mongoose.Types.ObjectId(response._id),
    video: videoId,
    likedBy: req.user?._id,
  });
  if (!deleteLikedVideo)
    throw new ApiError(
      500,
      "Something went wrong while deleting the like in the video"
    );
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video unliked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!mongoose.isValidObjectId(commentId))
    throw new ApiError(400, "Invalid comment");
  const response = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  // if no liked comment is there then create
  if (!response) {
    const newLikedComment = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });
    console.log(newLikedComment);
    if (!newLikedComment)
      throw new ApiError(500, "Something went wrong while liking the comment");
    return res
      .status(200)
      .json(
        new ApiResponse(200, newLikedComment, "Comment liked successfully")
      );
  }
  const deleteLikedComment = await Like.deleteOne({
    _id: new mongoose.Types.ObjectId(response._id),
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (!deleteLikedComment)
    throw new ApiError(
      500,
      "Something went wrong while deleting the like in the comment"
    );
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment unliked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!mongoose.isValidObjectId(tweetId))
    throw new ApiError(400, "Invalid tweet");
  const response = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  // if no liked comment is there then create
  if (!response) {
    const newLikedTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
    console.log(newLikedTweet);
    if (!newLikedTweet)
      throw new ApiError(500, "Something went wrong while liking the tweet");
    return res
      .status(200)
      .json(new ApiResponse(200, newLikedTweet, "Tweet liked successfully"));
  }
  const deleteLikedTweet = await Like.deleteOne({
    _id: new mongoose.Types.ObjectId(response._id),
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  if (!deleteLikedTweet)
    throw new ApiError(
      500,
      "Something went wrong while deleting the like in the tweet"
    );
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet unliked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const response = await Like.find({
    likedBy: req.user?._id,
    video: { $exists: true },
  });
  if (!response) throw new ApiError(404, "No liked videos found");
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Liked videos found"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
