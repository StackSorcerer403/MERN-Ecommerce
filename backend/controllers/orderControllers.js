import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();
// import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc  create a new order
// @route GET /api/orders
// @access PRIVATE
const addOrderItems = asyncHandler(async (req, res) => {
	const {
		orderItems,
		shippingAddress,
		paymentMethod,
		itemsPrice,
		shippingPrice,
		taxPrice,
		totalPrice,
	} = req.body;

	if (orderItems && !orderItems.length) {
		res.status(401);
		throw new Error('No order items');
	} else {
		const order = new Order({
			user: req.user._id,
			orderItems,
			shippingAddress,
			paymentMethod,
			itemsPrice,
			shippingPrice,
			taxPrice,
			totalPrice,
		});
		const createdOrder = await order.save();
		res.status(201).json(createdOrder);
	}
});

// @desc  get an order by id
// @route GET /api/orders/:id
// @access PRIVATE
const getOrderById = asyncHandler(async (req, res) => {
	const reqOrder = await Order.findById(req.params.id).populate(
		'user',
		'name email'
	);
	if (reqOrder) {
		res.status(201).json(reqOrder);
	} else {
		res.status(401);
		throw new Error('Order not found');
	}
});

// @desc  update the order object once paid
// @route PUT /api/orders/:id/pay
// @access PRIVATE
const updateOrderToPay = asyncHandler(async (req, res) => {
	const order = await Order.findById(req.params.id);
	if (order) {
		const { paymentMode } = req.body;
		order.isPaid = true;
		order.paidAt = Date.now();
		if (paymentMode === 'paypal') {
			order.paymentResult = {
				type: 'paypal',
				id: req.body.id,
				status: req.body.status,
				update_time: req.body.update_time,
				email_address: req.body.payer.email_address,
			};
		} else if (paymentMode === 'stripe') {
			order.paymentResult = {
				type: 'stripe',
				id: req.body.id,
				status: req.body.status,
				email_address: req.body.receipt_email,
			};
		}

		const updatedOrder = await order.save();
		res.status(201).json(updatedOrder);
	} else {
		res.status(401);
		throw new Error('Order not found');
	}
});

// @desc  update the order object once delivered
// @route PUT /api/orders/:id/pay
// @access PRIVATE/ADMIN
const updateOrderToDeliver = asyncHandler(async (req, res) => {
	const order = await Order.findById(req.params.id);
	if (order) {
		order.isDelivered = true;
		order.deliveredAt = Date.now();

		const updatedOrder = await order.save();
		res.status(201).json(updatedOrder);
	} else {
		res.status(401);
		throw new Error('Order not found');
	}
});

// @desc  fetch the orders of the user logged in
// @route GET /api/orders/myorders
// @access PRIVATE
const getMyOrders = asyncHandler(async (req, res) => {
	const allOrders = await Order.find({ user: req.user._id });
	res.json(allOrders);
});

// @desc  fetch all orders
// @route GET /api/orders
// @access PRIVATE/ADMIN
const getAllOrders = asyncHandler(async (req, res) => {
	const page = Number(req.query.pageNumber) || 1;
	const pageSize = 10;

	const count = await Order.countDocuments({});
	const orders = await Order.find({})
		.limit(pageSize)
		.skip(pageSize * (page - 1))
		.populate('user', 'id name')
		.sort('-createdAt');

	res.json({ orders, page, pages: Math.ceil(count / pageSize) });
});

// @desc  create payment intent for stripe payment
// @route POST /api/orders/stripe-payment
// @access PUBLIC
const stripePayment = asyncHandler(async (req, res) => {
	const { price, email } = req.body;

	const paymentIntent = await stripe.paymentIntents.create({
		amount: price,
		currency: 'inr',
		receipt_email: email,
		// customer: id,
		payment_method_types: ['card'],
	});

	res.send({
		clientSecret: paymentIntent.client_secret,
	});
	// const { order, token } = req.body;
	// const idempotencyKey = nanoid();
	// return stripe.customers
	// 	.create({
	// 		email: token.email,
	// 		source: token.id,
	// 	})
	// 	.then((customer) => {
	// 		stripe.charges.create(
	// 			{
	// 				amount: order.totalPrice * 100,
	// 				currency: 'inr',
	// 				customer: customer.id,
	// 				receipt_email: token.email,
	// 				// description: product.name,
	// 			},
	// 			{ idempotencyKey }
	// 		);
	// 	})
	// 	.then((result) => res.status(200).json(result))
	// 	.catch((err) => console.log(err));
});

export {
	addOrderItems,
	getOrderById,
	updateOrderToPay,
	updateOrderToDeliver,
	getMyOrders,
	getAllOrders,
	stripePayment,
};
