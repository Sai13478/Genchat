import mongoose from "mongoose";

const authenticatorSchema = new mongoose.Schema({
  credentialID: { type: Buffer, required: true, unique: true },
  publicKey: { type: Buffer, required: true },
  counter: { type: Number, required: true },
  transports: [{ type: String }],
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "Hey there! I am using GenChat.",
    },
    tag: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: function (v) {
          // At least one letter and one number
          return /^(?=.*[A-Za-z])(?=.*\d).+$/.test(v);
        },
        message: props => "Password must contain at least one letter and one number!"
      }
    },
    profilePic: {
      type: String,
      default: "",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // For WebAuthn
    authenticators: [authenticatorSchema],
    currentChallenge: { type: String },
    settings: {
      accessibility: {
        fontSize: { type: String, default: "medium" },
        highContrast: { type: Boolean, default: false },
      },
      privacy: {
        readReceipts: { type: Boolean, default: true },
      },
      notifications: {
        messageSounds: { type: Boolean, default: true },
        desktopAlerts: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1, tag: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
