const joi = require("joi");
const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  flightFrom: {
    type: String,
    required: true,
    trim: true,
  },
  flightTo: {
    type: String,
    required: true,
    trim: true,
  },
  flightDate: {
    type: Date,
    required: true,
  },
  flightTime: {
    type: String,
    default: "",
    trim: true,
  },
  flightNumber: {
    type: String,
    default: "",
    trim: true,
  },
});

const passengerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  passportNumber: {
    type: String,
    required: true,
    trim: true,
    unique: false,
  },
  nationality: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    trim: true,
    enum: ["Male", "Female", "Other", "Prefer not to say"],
  },
});

const orderSchema = new mongoose.Schema(
  {
    customerNumber: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    agentNumber: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    flight: {
      type: flightSchema,
      required: true,
    },
    returnFlight: {
      type: flightSchema,
      required: false,
    },
    orderStatus: {
      type: String,
      required: true,
      default: "Send To Agent",
      enum: [
        "Send To Agent",
        "Pending Agent Approval",
        "Confirmed",
        "Cancelled",
      ],
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    Passengers: {
      type: [passengerSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "Order must have at least one passenger.",
      },
    },
    notes: {
      type: String,
      required: false,
      default: "",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema, "orders");

const orderValidation = joi.object({
  customerNumber: joi.string().hex().length(24),
  agentNumber: joi.string().hex().length(24),
  orderDate: joi.date(),
  flight: joi
    .object({
      flightFrom: joi.string().required().trim(),
      flightTo: joi.string().required().trim(),
      flightDate: joi.date().required(),
      flightTime: joi.string().trim(),
      flightNumber: joi.string().trim(),
    })
    .required(),
  returnFlight: joi
    .object({
      flightFrom: joi.string().trim(),
      flightTo: joi.string().trim(),
      flightDate: joi.date().required(),
      flightTime: joi.string().trim(),
      flightNumber: joi.string().trim(),
    })
    .optional(),
  orderStatus: joi
    .string()
    .valid("Send To Agent", "Pending Agent Approval", "Confirmed", "Cancelled"),
  Passengers: joi
    .array()
    .items(
      joi.object({
        firstName: joi.string().required().trim(),
        lastName: joi.string().required().trim(),
        passportNumber: joi.string().required().trim(),
        nationality: joi.string().required().trim(),
        dateOfBirth: joi.date().required(),
        gender: joi.string().required().trim(),
      })
    )
    .min(1)
    .required(),
  notes: joi.string().trim(),
});

const orderUpdateByUserValidation = joi.object({
  flight: joi.object({
    flightFrom: joi.string().trim(),
    flightTo: joi.string().trim(),
    flightDate: joi.date(),
  }),
  returnFlight: joi.object({
    flightFrom: joi.string().trim(),
    flightTo: joi.string().trim(),
    flightDate: joi.date(),
  }),
  Passengers: joi
    .array()
    .items(
      joi.object({
        firstName: joi.string().required().trim(),
        lastName: joi.string().required().trim(),
        passportNumber: joi.string().required().trim(),
        nationality: joi.string().required().trim(),
        dateOfBirth: joi.date().required(),
        gender: joi.string().required().trim(),
      })
    )
    .min(1),
  notes: joi.string().trim(),
});

const orderUpdateByAgentValidation = joi.object({
  orderDate: joi.date(),
  flight: joi.object({
    flightFrom: joi.string().trim(),
    flightTo: joi.string().trim(),
    flightDate: joi.date(),
    flightTime: joi.string().trim(),
    flightNumber: joi.string().trim(),
  }),
  returnFlight: joi.object({
    flightFrom: joi.string().trim(),
    flightTo: joi.string().trim(),
    flightDate: joi.date(),
    flightTime: joi.string().trim(),
    flightNumber: joi.string().trim(),
  }),
  orderStatus: joi
    .string()
    .valid("Send To Agent", "Pending Agent Approval", "Confirmed", "Cancelled"),
  price: joi.number().min(0),
  Passengers: joi
    .array()
    .items(
      joi.object({
        firstName: joi.string().required().trim(),
        lastName: joi.string().required().trim(),
        passportNumber: joi.string().required().trim(),
        nationality: joi.string().required().trim(),
        dateOfBirth: joi.date().required(),
        gender: joi.string().required().trim(),
      })
    )
    .min(1),
  notes: joi.string().trim(),
});

module.exports = {
  Order,
  orderValidation,
  orderUpdateByUserValidation,
  orderUpdateByAgentValidation,
};
