const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const {
  User,
  UserValidation,
  SignInValidation,
  UserUpdateValidation,
  UserUpdateStatusValidation,
} = require("../model/user");
const countries = require("../data/countries");

const authMW = require("../middleware/authMW");

router.post("/", async (req, res, next) => {
  //* register user
  try {
    //validate request
    const { error } = UserValidation.validate(req.body);
    if (error) {
      const validationError = new Error(error.details[0].message);
      validationError.statusCode = 400;
      return next(validationError);
    }
    //validate system
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      const registrationError = new Error("User already exists");
      registrationError.statusCode = 409;
      return next(registrationError);
    }

    const passportCountryInput = req.body.passport?.passportCountry;
    if (passportCountryInput) {
      const allowedCountryNamesLowercase = countries.map(
        (country) => country.countryCode
      );
      if (
        !allowedCountryNamesLowercase.includes(
          passportCountryInput.toUpperCase()
        )
      ) {
        const passportError = new Error("Invalid passport country");
        passportError.statusCode = 400;
        return next(passportError);
      }
    }
    //process
    user = new User({
      ...req.body,
      createAt: new Date(),
      balance: 0,
      orders: [],
      isAgent: false,
      isAdmin: false,
      passportCountry: req.body.passport?.passportCountry.toUpperCase(),
      password: await bcrypt.hash(req.body.password, 10),
    });
    const savedUser = await user.save();
    if (!savedUser) {
      const saveError = new Error("User could not be saved");
      saveError.statusCode = 500;
      return next(saveError);
    }
    //response
    res.send(
      _.pick(savedUser, ["name", "email", "phone", "address", "createAt"])
    );
  } catch (error) {
    const saveError = new Error("Internal Server Error");
    saveError.statusCode = 500;
    return next(saveError);
  }
});

router.post("/login", async (req, res, next) => {
  //* sign in user
  try {
    //validate request
    const { error } = SignInValidation.validate(req.body);
    if (error) {
      const validationError = new Error(error.details[0].message);
      validationError.statusCode = 400;
      return next(validationError);
    }
    //validate system
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      const loginError = new Error("Invalid email or password");
      loginError.statusCode = 401;
      return next(loginError);
    }
    //compare password
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      const passwordError = new Error("Invalid email or password");
      passwordError.statusCode = 401;
      return next(passwordError);
    }
    //process
    const token = jwt.sign(
      { _id: user._id, isAdmin: user.isAdmin, isAgent: user.isAgent },
      process.env.JWT_KEY
    );
    //response
    res.status(200).send(token);
  } catch (error) {
    const serverError = new Error("Internal Server Error");
    serverError.statusCode = 500;
    return next(serverError);
  }
});

router.get("/:id", authMW, async (req, res, next) => {
  //* Get user - The registered user or admin or agent
  try {
    //validate system
    if (
      !req.user.isAdmin &&
      !req.user.isAgent &&
      req.user._id != req.params.id
    ) {
      const validationError = new Error(
        "You are not a Admin user or this user."
      );
      validationError.statusCode = 403;
      return next(validationError);
    }
    //process
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      const notFoundError = new Error("User not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res.status(200).send(user);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authMW, async (req, res, next) => {
  //* Update user - The registered user or Agent or Admin
  try {
    //validate request
    const { error } = UserUpdateValidation.validate(req.body);
    if (error) {
      const validationError = new Error(error.details[0].message);
      validationError.statusCode = 400;
      return next(validationError);
    }
    //validate system
    if (
      !req.user.isAgent &&
      !req.user.isAdmin &&
      req.user._id != req.params.id
    ) {
      const validationError = new Error(
        "You are not a Admin user or this user."
      );
      validationError.statusCode = 403;
      return next(validationError);
    }

    // fetch the user being updated
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      const notFoundError = new Error("User not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }

    // validate email
    // Only proceed if email is provided in the request body and it's different from the current user's email
    if (req.body.email && req.body.email !== currentUser.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      // If an existing user is found AND their ID is different from the current user's ID
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        const emailError = new Error("Email already exists for another user");
        emailError.statusCode = 409;
        return next(emailError);
      }
    }

    // validate phone
    // Only proceed if phone is provided in the request body and it's different from the current user's phone
    if (req.body.phone && req.body.phone !== currentUser.phone) {
      // Added comparison with currentUser.phone
      const existingUser = await User.findOne({ phone: req.body.phone });
      // If an existing user is found AND their ID is different from the current user's ID
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        // Ensure it's not the same user
        const phoneError = new Error(
          "Phone number already exists for another user"
        );
        phoneError.statusCode = 409;
        return next(phoneError);
      }
    }

    //process
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedUser) {
      const notFoundError = new Error("User not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res.status(200).send(updatedUser);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", authMW, async (req, res, next) => {
  //* Update user status (Agent / Admin) - The admin user
  try {
    //validate request
    const { error } = UserUpdateStatusValidation.validate(req.body);
    if (error) {
      const validationError = new Error(error.details[0].message);
      validationError.statusCode = 400;
      return next(validationError);
    }

    //validate system
    if (!req.user.isAdmin) {
      const validationError = new Error("You are not an Admin user.");
      validationError.statusCode = 403;
      return next(validationError);
    }
    //process
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      const notFoundError = new Error("User not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res.status(200).send(updatedUser);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authMW, async (req, res, next) => {
  //* Delete user - The registered user or admin
  try {
    //validate system
    if (!req.user.isAdmin && req.user._id != req.params.id) {
      const validationError = new Error(
        "You are not a Admin user or this user."
      );
      validationError.statusCode = 403;
      return next(validationError);
    }
    //process
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      const notFoundError = new Error("User not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res.status(200).send(deletedUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
