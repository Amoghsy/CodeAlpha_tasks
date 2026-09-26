const { supabase } = require('../config/supabaseClient');
const { z } = require('zod');

// Store Pricing & Promotion Configuration (Backend Source of Truth)
const STORE_RULES = {
  SHIPPING: {
    FREE_THRESHOLD: 999.00,
    FLAT_RATE: 99.00
  },
  TAX_RATE: 0.08, // 8% sales tax
  PROMO_CODES: {
    'SAVE10': { discount: 0.10, label: '10% Off' },
    'ALPHA20': { discount: 0.20, label: '20% Off' },
    'FREESHIP': { freeShipping: true, label: 'Free Shipping' }
  }
};

// Validation Schemas
const addToCartSchema = z.object({
  body: z.object({
    product_id: z.string().uuid('Valid product UUID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1)
  })
});

const updateCartSchema = z.object({
  params: z.object({
    itemId: z.string().uuid('Valid item UUID is required')
  }),
  body: z.object({
    quantity: z.number().int().min(0, 'Quantity cannot be negative')
  })
});

/**
 * Calculate cart breakdown, totals, discounts and shipping (Backend Business Logic)
 */
function calculateSummary(items = [], promoCode = '') {
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);

  const cleanPromo = (promoCode || '').trim().toUpperCase();
  const promo = STORE_RULES.PROMO_CODES[cleanPromo] || null;

  let discount = 0;
  let isFreeShipping = subtotal >= STORE_RULES.SHIPPING.FREE_THRESHOLD || subtotal === 0;

  if (promo) {
    if (promo.discount) {
      discount = subtotal * promo.discount;
    }
    if (promo.freeShipping) {
      isFreeShipping = true;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = (subtotal === 0 || isFreeShipping) ? 0 : STORE_RULES.SHIPPING.FLAT_RATE;
  const tax = discountedSubtotal * STORE_RULES.TAX_RATE;
  const total = discountedSubtotal + shipping + tax;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    promo: promo ? { code: cleanPromo, ...promo } : null,
    shipping: Number(shipping.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount,
    freeShippingThresholdRemaining: Math.max(0, STORE_RULES.SHIPPING.FREE_THRESHOLD - subtotal)
  };
}

/**
 * Public/Protected endpoint to calculate cart summary
 */
async function calculateCart(req, res, next) {
  try {
    const { items = [], promoCode = '' } = req.body;
    const summary = calculateSummary(items, promoCode);
    return res.status(200).json({ data: summary });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user's cart with product details joined
 */
async function getCart(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        created_at,
        products (
          id,
          name,
          price,
          image_url,
          category,
          stock_quantity
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Format list nicely for frontend
    const formatted = (cartItems || []).map(item => ({
      id: item.products?.id,
      cartItemId: item.id,
      name: item.products?.name,
      price: item.products?.price,
      image: item.products?.image_url,
      category: item.products?.category,
      stock: item.products?.stock_quantity,
      quantity: item.quantity
    }));

    const summary = calculateSummary(formatted);

    return res.status(200).json({
      data: formatted,
      summary
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a product to current user's cart
 */
async function addToCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    // Check product existence and stock
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity')
      .eq('id', product_id)
      .single();

    if (prodError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        error: `Only ${product.stock_quantity} units available in stock.`
      });
    }

    // Check if item already exists in user's cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', product_id)
      .maybeSingle();

    let result;
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock_quantity) {
        return res.status(400).json({
          error: `Cannot add more. You have ${existingItem.quantity} in cart, and only ${product.stock_quantity} in stock.`
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) return res.status(500).json({ error: updateError.message });
      result = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: product_id,
          quantity: quantity
        })
        .select()
        .single();

      if (insertError) return res.status(500).json({ error: insertError.message });
      result = inserted;
    }

    return res.status(200).json({
      message: 'Item added to cart successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update quantity of a cart item
 */
async function updateCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === 0) {
      const { error: delError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (delError) return res.status(500).json({ error: delError.message });
      return res.status(200).json({ message: 'Item removed from cart' });
    }

    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, product_id, products (stock_quantity)')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const availableStock = cartItem.products?.stock_quantity || 0;
    if (quantity > availableStock) {
      return res.status(400).json({
        error: `Requested quantity exceeds available stock (${availableStock} items).`
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({
      message: 'Cart updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Remove an item from cart
 */
async function removeFromCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Item removed from cart'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Sync guest local storage cart items into user's account cart
 */
async function syncCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { items = [] } = req.body;

    for (const item of items) {
      if (item.id) {
        await supabase
          .from('cart_items')
          .upsert({
            user_id: userId,
            product_id: item.id,
            quantity: item.quantity || 1
          }, { onConflict: 'user_id,product_id' });
      }
    }

    return res.status(200).json({ message: 'Cart synced successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  calculateCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  syncCart,
  addToCartSchema,
  updateCartSchema
};
