const { timeStamp } = require("console");
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
  passportDate: {
    type: Date,
    required: false,
  },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  number: {
    type: String,
    required: true,
    trim: true,
  },
});
const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: userSchema,
      required: true,
      ref: "User",
    },
    agent: {
      type: userSchema,
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
      default: "Wait For Agent",
      enum: [
        "Wait For Agent",
        "In Progress",
        "Pending Customer Approval",
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
  customer: joi.object({
    name: joi.string().required().trim(),
    email: joi.string().email().required().trim(),
    phone: joi.string().required().trim(),
    number: joi.string().required().trim(),
  }),
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
    .valid(
      "Wait For Agent",
      "In Progress",
      "Pending Customer Approval",
      "Confirmed",
      "Cancelled"
    ),
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
        passportDate: joi.date(),
      })
    )
    .min(1)
    .required(),
  notes: joi.string().trim().allow(""),
});

const orderUpdate = joi.object({
  flight: joi
    .object({
      flightFrom: joi.string().trim().allow(""),
      flightTo: joi.string().trim().allow(""),
      flightDate: joi.date().allow(""),
      flightTime: joi.string().trim().allow(""),
      flightNumber: joi.string().trim().allow(""),
    })
    .optional(),
  returnFlight: joi
    .object({
      flightFrom: joi.string().trim().allow(""),
      flightTo: joi.string().trim().allow(""),
      flightDate: joi.date().allow(""),
      flightTime: joi.string().trim().allow(""),
      flightNumber: joi.string().trim().allow(""),
    })
    .optional(),
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
        passportDate: joi.date().allow(""),
      })
    )
    .min(1)
    .optional(),
  price: joi.number().min(0).optional(),
  orderStatus: joi
    .string()
    .valid(
      "Wait For Agent",
      "In Progress",
      "Pending Customer Approval",
      "Confirmed",
      "Cancelled"
    )
    .optional(),
  notes: joi.string().trim().optional().allow(""),
  agent: joi
    .object({
      name: joi.string().trim(),
      email: joi.string().email().trim(),
      phone: joi.string().trim(),
      number: joi.string().trim(),
    })
    .optional(),
});

const orderUpdateByAgentValidation = joi.object({
  orderDate: joi.date(),
  flight: joi
    .object({
      flightFrom: joi.string().trim(),
      flightTo: joi.string().trim(),
      flightDate: joi.date(),
      flightTime: joi.string().trim().allow(""),
      flightNumber: joi.string().trim().allow(""),
    })
    .required(),
  returnFlight: joi
    .object({
      flightFrom: joi.string().trim().allow(""),
      flightTo: joi.string().trim().allow(""),
      flightDate: joi.date().allow(""),
      flightTime: joi.string().trim().allow(""),
      flightNumber: joi.string().trim().allow(""),
    })
    .optional(),
  orderStatus: joi
    .string()
    .valid(
      "Wait For Agent",
      "In Progress",
      "Pending Customer Approval",
      "Confirmed",
      "Cancelled"
    ),
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
        passportDate: joi.date().allow(""),
      })
    )
    .min(1),
  notes: joi.string().trim().allow(""),
});

module.exports = {
  Order,
  orderValidation,
  orderUpdate,
  orderUpdateByAgentValidation,
};
