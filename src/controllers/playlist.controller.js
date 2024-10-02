import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { response } from "express";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  if (!name && !description) throw new ApiError(400, "All field is required");
  const response = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  if (!response)
    throw new ApiError(500, "Something went wrong while creating playlist");
  return res
    .status(201)
    .json(new ApiResponse(201, response, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!mongoose.isValidObjectId(userId))
    throw new ApiError(400, "Invalid User");

  const response = await Playlist.find({ owner: userId });
  if (!response) throw new ApiError(404, "No playlist found");

  return res
    .status(200)
    .json(new ApiResponse(200, response, "User playlist found"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!mongoose.isValidObjectId(playlistId))
    throw new ApiError(404, "Playlist not found");
  const response = await Playlist.findOne({
    _id: new mongoose.Types.ObjectId(playlistId),
    owner: req.user?._id,
  });
  if (!response)
    throw new ApiError(500, "Something went wrong while getting playlist");
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!mongoose.isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist");
  if (!mongoose.isValidObjectId(videoId))
    throw new ApiError(400, "Invalid video");

  const playlist = await Playlist.findOne({
    _id: new mongoose.Types.ObjectId(playlistId),
    owner: req.user?._id,
  });
  if (!playlist)
    throw new ApiError(500, "Something went wrong while finding playlist");

  if (playlist.videos.includes(videoId))
    return new ApiError(400, "Video already exists in the playlist");

  playlist.videos.push(videoId);
  const response = await playlist.save();
  if (!response)
    throw new ApiError(
      500,
      "Something went wrong while adding video in playlist"
    );
  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Video addeded successfully to playlist")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!mongoose.isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist");
  if (!mongoose.isValidObjectId(videoId))
    throw new ApiError(400, "Invalid video");
  const playlist = await Playlist.findOne({
    _id: new mongoose.Types.ObjectId(playlistId),
    owner: req.user?._id,
  });
  if (!playlist)
    throw new ApiError(500, "Something went wrong while finding playlist");

  if (!playlist.videos.includes(videoId))
    return new ApiError(400, "Video doesnt exists in the playlist");

  const removeVideo = playlist.videos.pull(videoId);
  const response = await playlist.save();
  if (!response)
    throw new ApiError(500, "Something went wrong while removing video");
  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Video removed from playlist successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!mongoose.isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist");
  const response = await Playlist.deleteOne({
    _id: new mongoose.Types.ObjectId(playlistId),
    owner: req.user?._id,
  });
  if (!response)
    throw new ApiError(500, "Something went wrong while deleting playlist");
  return res.status(200).json(200, {}, "Playlist removed successfully");
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!name && !description) throw new ApiError(400, "All field is required");
  //TODO: update playlist
  if (!mongoose.isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist");
  const response = await Playlist.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(playlistId),
      owner: req.user?._id,
    },
    { $set: { name, description } },
    { new: true }
  );
  if (!response)
    throw new ApiError(500, "Something went wrong while updating Playlist");
  return res.status(200).json(200, response, "Playlist updated successfully");
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
