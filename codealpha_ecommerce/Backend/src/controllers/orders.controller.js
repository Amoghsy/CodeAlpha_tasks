const { supabase } = require('../config/supabaseClient');
const { z } = require('zod');

// Order Validation Schema
const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().min(2, 'Full name is required'),
      email: z.string().email().optional(),
      phone: z.string().min(5, 'Phone number is required'),
      address: z.string().min(5, 'Street address is required'),
      city: z.string().min(2, 'City is required'),
      state: z.string().optional(),
      zip: z.string().min(2, 'Postal code is required'),
      country: z.string().min(2, 'Country is required')
    }),
    paymentMethod: z.string().optional().default('card')
  })
});

/**
 * Place a new order from current user's cart or payload
 */
async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    // 1. Fetch user's active cart items with product details
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id, quantity, product_id, products (id, name, price, stock_quantity)')
      .eq('user_id', userId);

    if (cartError) {
      return res.status(500).json({ error: cartError.message });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Cannot create an order.' });
    }

    // 2. Validate stock for all products
    let calculatedSubtotal = 0;
    for (const item of cartItems) {
      const product = item.products;
      if (!product) {
        return res.status(400).json({ error: 'One or more products in your cart no longer exist.' });
      }
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Only ${product.stock_quantity} available.`
        });
      }
      calculatedSubtotal += Number(product.price) * item.quantity;
    }

    // 3. Calculate taxes and shipping
    const shipping = calculatedSubtotal >= 50 ? 0 : 5.00;
    const tax = calculatedSubtotal * 0.08;
    const totalAmount = Number((calculatedSubtotal + shipping + tax).toFixed(2));

    // 4. Create Order Record
    const { data: newOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'paid',
        total_amount: totalAmount,
        shipping_address: shippingAddress
      })
      .select()
      .single();

    if (orderInsertError || !newOrder) {
      return res.status(500).json({ error: orderInsertError?.message || 'Failed to initialize order.' });
    }

    // 5. Insert Order Items & Decrement Product Stocks
    const orderItemsToInsert = [];

    for (const item of cartItems) {
      orderItemsToInsert.push({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.products.price
      });

      // Decrement product stock
      const newStock = Math.max(0, item.products.stock_quantity - item.quantity);
      await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', item.product_id);
    }

    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsInsertError) {
      console.error('Order items insert error:', itemsInsertError.message);
    }

    // 6. Clear user's shopping cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    return res.status(201).json({
      message: 'Order created and processed successfully',
      data: {
        id: newOrder.id,
        date: newOrder.created_at,
        status: newOrder.status,
        total: newOrder.total_amount,
        shippingAddress: newOrder.shipping_address,
        itemsCount: orderItemsToInsert.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all past orders for the authenticated user
 */
async function getOrders(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        shipping_address,
        created_at,
        order_items (
          id,
          quantity,
          price_at_purchase,
          product_id,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Format orders for response
    const formatted = (orders || []).map(o => ({
      id: o.id,
      date: o.created_at,
      status: o.status,
      total: Number(o.total_amount),
      shippingAddress: o.shipping_address,
      items: (o.order_items || []).map(oi => ({
        id: oi.id,
        productId: oi.products?.id || oi.product_id,
        name: oi.products?.name || 'Product',
        price: Number(oi.price_at_purchase),
        quantity: oi.quantity,
        image: oi.products?.image_url || ''
      }))
    }));

    return res.status(200).json({
      data: formatted
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single order with its items
 */
async function getOrderById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        shipping_address,
        created_at,
        order_items (
          id,
          quantity,
          price_at_purchase,
          product_id,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: `Order with ID "${id}" not found.` });
    }

    return res.status(200).json({
      data: {
        id: order.id,
        date: order.created_at,
        status: order.status,
        total: Number(order.total_amount),
        shippingAddress: order.shipping_address,
        items: (order.order_items || []).map(oi => ({
          id: oi.id,
          productId: oi.products?.id || oi.product_id,
          name: oi.products?.name,
          price: Number(oi.price_at_purchase),
          quantity: oi.quantity,
          image: oi.products?.image_url
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  createOrderSchema
};
