import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // file system from nodejs

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET, // Click 'View API Keys' above to copy your API secret
});
const uploadOnCloudinary = async (localFilePath, type) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: type || "auto",
    });
    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  } finally {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};
// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;
//     // upload file on cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto", // auto detect file type
//     }); // file url
//     fs.unlinkSync(localFilePath);
//     // file has been upload
//     // console.log("File is uploaded on cloudinary", response.url);
//     return response;
//   } catch (error) {
//     // remove in sync way not async
//     fs.unlinkSync(localFilePath);
//     // remove the file from local server since first adding file to server than cloudinary is optimal
//   }
// };
//

// for finding the public path
const getPublicIdFromUrl = (url) => {
  const urlParts = url.split("/"); // form array
  console.log(urlParts);
  //   //[
  //   'http:',
  //   '',
  //   'res.cloudinary.com',
  //   'dyxscq455',
  //   'image',
  //   'upload',
  //   'v1727515198',
  //   'mmmfwqctxdjvtu46z0ge.webp'// taking this part
  // ]
  const fileNameWithExt = urlParts[urlParts.length - 1]; // Get the last part (file name with extension)
  const [publicId] = fileNameWithExt.split("."); // Remove the file extension (e.g., .jpg) destructring and taking first element
  return publicId;
};

const deleteFromCloudinary = async (localFilePath, type) => {
  try {
    if (!localFilePath) return null;
    const publicID = getPublicIdFromUrl(localFilePath);
    console.log(publicID);

    const response = await cloudinary.uploader.destroy(publicID, {
      resource_type: type || "auto",
    });
    console.log(response);
    return response;
  } catch (error) {
    console.log(error.message);
    return null;
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };
