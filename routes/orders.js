const express = require("express");
const router = express.Router();
const {
  Order,
  orderValidation,
  orderUpdate,
  orderUpdateByAgentValidation,
} = require("../model/order");
const authMW = require("../middleware/authMW");
const _ = require("lodash");
const e = require("express");

router.get("/my-orders", authMW, async (req, res, next) => {
  //* Get all orders - requires agent role or customer role
  try {
    let orders = [];
    //validate request

    //validate system
    if (req.user.isAgent) {
      orders = await Order.find({ "agent.number": req.user._id });
    } else {
      orders = await Order.find({ "customer.number": req.user._id });
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
        _id: order._id,
        customer: order.customer,
        orderDate: order.orderDate,
        flight: order.flight ? order.flight : null,
        returnFlight: order.returnFlight ? order.returnFlight : null,
        agent: order.agent ? order.agent : null,
        orderStatus: order.orderStatus,
        price: order.price ? order.price : null,
        Passengers: order.Passengers ? order.Passengers : null,
        notes: order.notes ? order.notes : null,
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
    const _id = req.params.id;
    const orderData = await Order.findById(_id);
    //validate system
    if (!orderData) {
      const notFoundError = new Error("Order not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }

    if (!req.user.isAdmin && !req.user.isAgent) {
      if (req.user._id !== orderData.customer.number) {
        const authError = new Error(
          "You are not authorized to view this order"
        );
        authError.statusCode = 403;
        return next(authError);
      }
    }
    //process
    const orderJson = {
      _id: orderData._id,
      customer: {
        number: orderData.customer.number,
        name: orderData.customer.name,
        email: orderData.customer.email,
        phone: orderData.customer.phone,
      },
      agent: orderData.agent
        ? {
            number: orderData.agent.number,
            name: orderData.agent.name,
            email: orderData.agent.email,
            phone: orderData.agent.phone,
          }
        : null,
      orderDate: orderData.orderDate,
      flight: orderData.flight ? orderData.flight : null,
      returnFlight: orderData.returnFlight ? orderData.returnFlight : null,
      orderStatus: orderData.orderStatus ? orderData.orderStatus : null,
      Passengers: orderData.Passengers ? orderData.Passengers : null,
      price: orderData.price ? orderData.price : null,
      notes: orderData.notes ? orderData.notes : null,
    };
    //response
    res.status(200).json(orderJson);
  } catch (err) {
    const error = new Error(err);
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
        _id: order._id || null,
        customer: order.customer || null,
        orderDate: order.orderDate ? order.orderDate.toString() : null,
        flight: order.flight ? order.flight : null,
        returnFlight: order.returnFlight || null,
        agent: order.agent || null,
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
    const error = new Error(err.date);
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
      customer: req.body.user,
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
      customer: {
        number: req.user._id,
        name: req.user.name.first + " " + req.user.name.last,
        email: req.user.email,
        phone: req.user.phone,
      },
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
          "customer",
          "orderDate",
          "flight",
          "returnFlight",
          "agent",
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
  //* Update order by agent or customer - requires agent role or admin role or customer role
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
    if (
      !req.user.isAgent &&
      !req.user.isAdmin &&
      req.user._id !== order.customer.number
    ) {
      const authError = new Error(
        "You are not authorized to update this order"
      );
      authError.statusCode = 403;
      return next(authError);
    }

    if (
      order.orderStatus !== "Wait For Agent" &&
      order.orderStatus !== "In Progress" &&
      order.orderStatus !== "Pending Customer Approval" &&
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
          "customer",
          "orderDate",
          "flight",
          "returnFlight",
          "agent",
          "orderStatus",
          "price",
          "Passengers",
        ])
      );
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
});

router.patch("/set-agent/:id", authMW, async (req, res, next) => {
  //* Set agent for order - admin role
  try {
    //validate system
    const order = await Order.findById(req.params.id);
    if (!order) {
      const notFoundError = new Error("Order not found");
      notFoundError.statusCode = 404;
      return next(notFoundError);
    }
    if (!req.user.isAdmin) {
      const authError = new Error("You are not an agent");
      authError.statusCode = 403;
      return next(authError);
    }

    if (
      order.orderStatus !== "Wait For Agent" &&
      order.orderStatus !== "In Progress" &&
      order.orderStatus !== "Pending Customer Approval" &&
      !req.user.isAdmin
    ) {
      const statusError = new Error("Cannot set agent at this stage");
      statusError.statusCode = 403;
      return next(statusError);
    }
    //process
    let updatedOrder;
    if (!req.body.agent) {
      updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { agent: null, orderStatus: "Wait For Agent" },
        { new: true, runValidators: true }
      );
    } else {
      updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { agent: req.body.agent, orderStatus: "In Progress" },
        { new: true, runValidators: true }
      );
    }
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
          "customer",
          "orderDate",
          "flight",
          "returnFlight",
          "agent",
          "orderStatus",
          "price",
          "Passengers",
        ])
      );
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    next(error);
  }
});

router.patch("/set-status/:id", authMW, async (req, res, next) => {
  //* edit order status by every user - requires agent role or admin role or customer role
  try {
    //validate request
    if (
      !req.body.orderStatus ||
      ![
        "Wait For Agent",
        "In Progress",
        "Pending Customer Approval",
        "Confirmed",
        "Cancelled",
      ].includes(req.body.orderStatus)
    ) {
      const validationError = new Error("Order status is required");
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
    if (
      !req.user.isAdmin ||
      !req.user.isAgent !== order.agent.number ||
      !req.user._id !== order.customer.number
    ) {
      const authError = new Error(
        "You are not authorized to update this order"
      );
      authError.statusCode = 403;
      return next(authError);
    }

    if (
      order.orderStatus !== "Wait For Agent" &&
      order.orderStatus !== "In Progress" &&
      order.orderStatus !== "Pending Customer Approval" &&
      !req.user.isAdmin
    ) {
      const statusError = new Error("Cannot set agent at this stage");
      statusError.statusCode = 403;
      return next(statusError);
    }
    //process
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { agent: req.body.agent, orderStatus: "In Progress" },
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
          "customer",
          "orderDate",
          "flight",
          "returnFlight",
          "agent",
          "orderStatus",
          "price",
          "Passengers",
        ])
      );
  } catch (err) {
    const error = new Error(err.message);
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
