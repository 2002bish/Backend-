import {asyncHandler} from "../utils/asyncHandeler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"

const registerUser= asyncHandler (async (req, res) =>{
    const {fullName,email,username,password} = req.body
    if (
        [fullName,email,username,password].some ((field)=>field?.trim()=="")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser =await UserActivation.findone ({
        $or: [{username}, {email}]
    })
    if (existedUser){
        throw new ApiError (409, "User with email or username already exist")
    }
    const avatarLocalpath= req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath= req.files.coverImage[0].path
    }

    if (!avatarLocalpath){
        throw new ApiError (400, "Avatar file is required")
    }
    const avatar= await uploadOnCloudinary(avatarLocalpath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url ||"",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createUser){
        throw new ApiError(500, "Something went wrong while regestring the user")

    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User register successfully")
    )

})

const loginUser =asyncHandeler(async(req, res) =>{
const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})



export {
    registerUser

}