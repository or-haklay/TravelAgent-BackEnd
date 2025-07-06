const express = require("express");
const router = express.Router();
const {
  Order,
  orderValidation,
  orderUpdateByUserValidation,
  orderUpdateByAgentValidation,
} = require("../model/order");
const authMW = require("../middleware/authMW");
const _ = require("lodash");

router.get("/my-orders", authMW, async (req, res, next) => {
  //* Get all orders - requires agent role or customer role
  try {
    let orders = [];
    //validate request

    //validate system
    if (req.user.isAgent) {
      orders = await Order.find({ agentNumber: req.user._id });
    } else {
      orders = await Order.find({ customerNumber: req.user._id });
    }

    if (!orders) {
      const notFoundError = new Error("No orders found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }

    if (orders.length === 0) {
      return res.status(200).send([]);
    }

    //process
    orders = orders.map((order) => {
      return {
        orderId: order._id,
        customerNumber: order.customerNumber,
        /* orderDate: order.orderDate, */
        flight: order.flight ? order.flight : null,
        returnFlight: order.returnFlight ? order.returnFlight : null,
        /* agentNumber: order.agentNumber ? order.agentNumber : null, */
        orderStatus: order.orderStatus,
        price: order.price ? order.price : null,
        Passengers: order.Passengers ? order.Passengers : null,
      };
    });
    orders = orders.sort((a, b) => {
      return new Date(b.orderDate) - new Date(a.orderDate);
    });
    //response
    res.status(200).send(orders);
  } catch (err) {
    const error = new Error("Error fetching orders");
    error.statusCode = 500;
    next(error);
  }
});

router.get("/:id", authMW, async (req, res, next) => {
  //* Get specific order by ID - requires agent role or customer role or admin role
  try {
    const orderId = req.params.id;
    const orderData = await Order.findById(orderId);
    //validate system
    if (!orderData) {
      const notFoundError = new Error("Order not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }

    if (!req.user.isAdmin && !req.user.isAgent) {
      if (req.user._id.toString() !== orderData.customerNumber.toString()) {
        const authError = new Error(
          "You are not authorized to view this order"
        );
        authError.statusCode = 403;
        return next(authError);
      }
    }
    //process
    const order = {
      orderId: orderData._id,
      customerNumber: orderData.customerNumber,
      agentNumber: orderData.agentNumber ? orderData.agentNumber : null,
      orderDate: orderData.orderDate,
      flight: orderData.flight ? orderData.flight : null,
      returnFlight: orderData.returnFlight ? orderData.returnFlight : null,
      orderStatus: orderData.orderStatus,
      price: orderData.price ? orderData.price : null,
    };
    //response
    res.status(200).json(order);
  } catch (err) {
    const error = new Error("Error fetching orders");
    error.statusCode = 500;
    next(error);
  }
});

router.get("/", authMW, async (req, res, next) => {
  //* Get all orders - requires admin or agent role
  try {
    //validate request
    if (!req.user.isAdmin && !req.user.isAgent) {
      const authError = new Error("You are not authorized to view orders");
      authError.statusCode = 403;
      return next(authError);
    }
    //validate system
    let orders = await Order.find();
    if (!orders) {
      const notFoundError = new Error("No orders found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }

    if (orders.length === 0) {
      return res.status(200).send([]);
    }

    //process
    orders = orders.map((order) => {
      return {
        orderId: order._id ? order._id.toString() : null,
        customerNumber: order.customerNumber
          ? order.customerNumber.toString()
          : null,
        orderDate: order.orderDate ? order.orderDate.toString() : null,
        flight: order.flight ? order.flight.toString() : null,
        returnFlight: order.returnFlight ? order.returnFlight.toString() : null,
        agentNumber: order.agentNumber ? order.agentNumber.toString() : null,
        orderStatus: order.orderStatus ? order.orderStatus.toString() : null,
        price: order.price ? order.price.toString() : null,
      };
    });
    orders = orders.sort((a, b) => {
      return new Date(b.orderDate) - new Date(a.orderDate);
    });

    //response
    res.status(200).send(orders);
  } catch (err) {
    const error = new Error("Error fetching orders");
    error.statusCode = 500;
    next(error);
  }
});

router.post("/", authMW, async (req, res, next) => {
  //* Create new order - requires customer role
  try {
    //validate request

    const { error } = orderValidation.validate(req.body);
    if (error) {
      const validationError = new Error(error.details[0].message);
      validationError.statusCode = 400;
      return next(validationError);
    }

    // validate system
    const customElements = await Order.findOne({
      customerNumber: req.user._id,
      "flight.flightFrom": req.body.flight.flightFrom,
      "flight.flightTo": req.body.flight.flightTo,
      "flight.flightDate": req.body.flight.flightDate,
    });
    if (customElements) {
      const conflictError = new Error("Order already exists");
      conflictError.statusCode = 409;
      return next(conflictError);
    }

    //process
    const newOrder = new Order({
      ...req.body,
      customerNumber: req.user._id,
    });

    const savedOrder = await newOrder.save();

    if (!savedOrder) {
      const notFoundError = new Error("Order could not be created");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res
      .status(201)
      .send(
        _.pick(savedOrder, [
          "_id",
          "customerNumber",
          "orderDate",
          "flight",
          "returnFlight",
          "agentNumber",
          "orderStatus",
          "price",
          "Passengers",
        ])
      );
  } catch (err) {
    console.error("Full error details:", err);
    const error = new Error("Error creating order");
    error.statusCode = 500;
    next(error);
  }
});

router.patch("/:id", authMW, async (req, res, next) => {
  //* Update order - requires user role (agent or customer)
  try {
    //validate request
    const { error } = orderUpdateByUserValidation.validate(req.body);
    if (error) {
      const validationError = new Error(error.details[0].message);
      validationError.statusCode = 400;
      return next(validationError);
    }
    //validate system
    const order = await Order.findById(req.params.id);
    if (!order) {
      const notFoundError = new Error("Order not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    if (req.user._id != order.customerNumber) {
      const authError = new Error(
        "You are not authorized to update this order"
      );
      authError.statusCode = 403;
      return next(authError);
    }

    if (order.orderStatus !== "Send To Agent") {
      const statusError = new Error("Order cannot be updated at this stage");
      statusError.statusCode = 403;
      return next(statusError);
    }
    //process
    const updateFields = {};

    if (req.body.notes !== undefined) {
      updateFields.notes = req.body.notes;
    }
    if (req.body.flight) {
      for (const key in req.body.flight) {
        updateFields[`flight.${key}`] = req.body.flight[key];
      }
    }
    if (req.body.returnFlight) {
      for (const key in req.body.returnFlight) {
        updateFields[`returnFlight.${key}`] = req.body.returnFlight[key];
      }
    }
    if (req.body.Passengers !== undefined) {
      updateFields.Passengers = req.body.Passengers;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      const notFoundError = new Error("Order could not be updated");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res
      .status(200)
      .send(
        _.pick(updatedOrder, [
          "_id",
          "customerNumber",
          "orderDate",
          "flight",
          "returnFlight",
          "agentNumber",
          "orderStatus",
          "price",
          "Passengers",
        ])
      );
  } catch (err) {
    const error = new Error("Error updating order");
    error.statusCode = 500;
    next(error);
  }
});

router.patch("/agent/:id", authMW, async (req, res, next) => {
  //* Update order by agent - requires agent role or admin role
  try {
    //validate request
    const { error } = orderUpdateByAgentValidation.validate(req.body);
    if (error) {
      const validationError = new Error(error.details[0].message);
      validationError.statusCode = 400;
      return next(validationError);
    }
    //validate system
    const order = await Order.findById(req.params.id);
    if (!order) {
      const notFoundError = new Error("Order not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    if (!req.user.isAgent && !req.user.isAdmin) {
      const authError = new Error("You are not an agent");
      authError.statusCode = 403;
      return next(authError);
    }
    if (
      order.agentNumber &&
      order.agentNumber.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      const authError = new Error(
        "You are not authorized to update this order"
      );
      authError.statusCode = 403;
      return next(authError);
    }

    if (
      order.orderStatus !== "Pending Agent Approval" &&
      order.orderStatus !== "Send To Agent" &&
      !req.user.isAdmin
    ) {
      const statusError = new Error("Order cannot be updated at this stage");
      statusError.statusCode = 403;
      return next(statusError);
    }
    //process
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      const notFoundError = new Error("Order could not be updated");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res
      .status(200)
      .send(
        _.pick(updatedOrder, [
          "_id",
          "customerNumber",
          "orderDate",
          "flight",
          "returnFlight",
          "agentNumber",
          "orderStatus",
          "price",
          "Passengers",
        ])
      );
  } catch (err) {
    const error = new Error("Error updating order");
    error.statusCode = 500;
    next(error);
  }
});

router.delete("/:id", authMW, async (req, res, next) => {
  //* Delete order - require admin role
  try {
    //validate request
    if (!req.user.isAdmin) {
      const authError = new Error("You are not authorized to delete orders");
      authError.statusCode = 403;
      return next(authError);
    }
    //validate system
    const order = await Order.findById(req.params.id);
    if (!order) {
      const notFoundError = new Error("Order not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //process
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      const notFoundError = new Error("Order could not be deleted");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    //response
    res.status(200).send(deletedOrder);
  } catch (err) {
    const error = new Error("Error deleting order");
    error.statusCode = 500;
    next(error);
  }
});

module.exports = router;
