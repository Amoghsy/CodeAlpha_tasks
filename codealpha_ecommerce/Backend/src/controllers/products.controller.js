const { supabase } = require('../config/supabaseClient');
const { z } = require('zod');

// Query Validation Schema
const getProductsQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().transform(v => (v ? parseInt(v, 10) : 1)),
    limit: z.string().regex(/^\d+$/).optional().transform(v => (v ? parseInt(v, 10) : 10))
  })
});

/**
 * List products with search, category filtering, and pagination
 */
async function getProducts(req, res, next) {
  try {
    const { category, search, sort, page = 1, limit = 10 } = req.query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Category Filter
    if (category && category !== 'all') {
      query = query.ilike('category', category);
    }

    // Search Filter (matches name or description)
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    // Sorting
    if (sort === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'name-asc') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Range for pagination
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalPages = Math.ceil((count || 0) / limit) || 1;

    return res.status(200).json({
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get product details by ID
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: `Product with ID "${id}" not found.` });
    }

    return res.status(200).json({
      data: product
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductById,
  getProductsQuerySchema
};
