const joi = require("joi");
const mongoose = require("mongoose");
const _ = require("lodash");

const nameSchema = new mongoose.Schema({
  first: { type: String, required: true, minlength: 2, maxlength: 255 },
  middle: { type: String, required: false, minlength: 2, maxlength: 255 },
  last: { type: String, required: true, minlength: 2, maxlength: 255 },
});

const addressSchema = new mongoose.Schema({
  country: { type: String, required: true, minlength: 2, maxlength: 255 },
  state: { type: String, required: false, minlength: 2, maxlength: 255 },
  city: { type: String, required: true, minlength: 2, maxlength: 255 },
  street: { type: String, required: true, minlength: 2, maxlength: 255 },
  houseNumber: { type: Number, required: false },
  zip: { type: Number, required: true },
});

const passportSchema = new mongoose.Schema({
  passportNumber: { type: String, required: false },
  passportDate: { type: Date, required: false },
  passportCountry: {
    type: String,
    required: false,
    minlength: 2,
    maxlength: 2,
  },
});

const validateEmail = function (email) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const userSchema = new mongoose.Schema({
  name: { type: nameSchema, required: true },
  phone: {
    type: String,
    minlength: 9,
    maxlength: 12,
    required: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    lowercase: true,
    trim: true,
    unique: true,
    validate: [validateEmail, "Please fill a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024,
  },
  address: { type: addressSchema, required: false },
  isAgent: {
    type: Boolean,
    required: true,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  passport: { type: passportSchema, required: false },
});

const User = mongoose.model("User", userSchema, "users");

const validation = joi.object({
  name: {
    first: joi.string().min(2).max(255).required(),
    middle: joi.string().min(2).max(255),
    last: joi.string().min(2).max(255).required(),
  },
  phone: joi.string().min(9).max(12).required(),
  email: joi.string().min(5).max(255).email().required(),
  password: joi.string().min(6).max(1024).required(),
  address: {
    country: joi.string().min(2).max(255).required(),
    state: joi.string().min(2).max(255),
    city: joi.string().min(2).max(255).required(),
    street: joi.string().min(2).max(255).required(),
    houseNumber: joi.number(),
    zip: joi.number().required(),
  },
  isAgent: joi.boolean(),
  isAdmin: joi.boolean(),
  createAt: joi.date(),
  passport: {
    passportNumber: joi.string(),
    passportDate: joi.date(),
    passportCountry: joi.string().min(2).max(2),
  },
});

const UserValidation = validation;

const SignInValidation = joi.object({
  email: joi.string().min(5).max(255).email().required(),
  password: joi.string().min(6).max(1024).required(),
});

const UserUpdateValidation = joi.object({
  name: {
    first: joi.string().min(2).max(255),
    middle: joi.string().min(2).max(255),
    last: joi.string().min(2).max(255),
  },
  phone: joi.string().min(9).max(12),
  email: joi.string().min(5).max(255).email(),
  password: joi.string().min(6).max(1024),
  image: {
    url: joi.string().min(9).max(255),
  },
  address: {
    country: joi.string().min(2).max(255),
    state: joi.string().min(2).max(255),
    city: joi.string().min(2).max(255),
    street: joi.string().min(2).max(255),
    houseNumber: joi.number(),
    zip: joi.number(),
  },
  passport: {
    passportNumber: joi.string(),
    passportDate: joi.date(),
    passportCountry: joi.string().min(2).max(2),
  },
});

const UserUpdateStatusValidation = joi.object({
  isAgent: joi.boolean(),
  isAdmin: joi.boolean(),
});

module.exports = {
  User,
  UserValidation,
  SignInValidation,
  UserUpdateValidation,
  UserUpdateStatusValidation,
};
