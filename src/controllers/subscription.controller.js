import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (isValidObjectId(channelId)) throw new ApiError(400, "Invalid Channel");

  const subscribedChannel = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });

  // not subscribed
  if (!subscribedChannel) {
    const newSubscribtion = await Subscription.create({
      channel: channelId,
      subscriber: req.user?._id,
    });
    if (!newSubscribtion)
      throw new ApiError(
        500,
        "Something went wrong while subscribing to the channel"
      );
    return res
      .status(201)
      .json(
        new ApiResponse(201, newSubscribtion, "Channel subscribed successfully")
      );
  }

  // subscribed
  const response = await Subscription.deleteOne({
    _id: new mongoose.Types.ObjectId(subscribedChannel._id),
  });
  if (!response)
    throw new ApiError(
      500,
      "Something went wrong while unsubscribing to the channel"
    );
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Channel unsubscribed successfully"));
});
// TODO == see response and return only required
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel");
  const response = await Subscription.find({ channel: channelId });
  if (!response) throw new ApiError(404, "No subcriber found");
  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Channel subscriber fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId))
    throw new ApiError(400, "Invalid channel");
  const response = await Subscription.find({ subscriber: subscriberId });
  if (!response) throw new ApiError(404, "No channel found");
  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Subcribed channel fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
