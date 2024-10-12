import {asyncHandler} from "../utils/asyncHandeler.js";

const registerUser= asyncHandler (async (req, res) =>{
    const {fullName,email,username,password} = req.body
    if (
        [fullName,email,username,password].some ((field)
    =>field?.trim()=="")
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

})


export {registerUser}