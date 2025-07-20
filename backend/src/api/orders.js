const express = require('express');
const amazonSPService = require('../services/amazon-sp-api.service');

const router = express.Router();

/**
 * @route GET /api/v1/orders
 * @desc Get list of orders with optional filters
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      createdAfter,
      createdBefore,
      orderStatuses,
      marketplaceIds,
      maxResults = 50,
      nextToken
    } = req.query;

    // If nextToken is provided, use pagination endpoint
    if (nextToken) {
      const result = await amazonSPService.getOrdersByNextToken(nextToken);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    }

    // Build parameters object
    const params = {
      MaxResults: parseInt(maxResults, 10)
    };

    if (createdAfter) {
      params.CreatedAfter = createdAfter;
    }

    if (createdBefore) {
      params.CreatedBefore = createdBefore;
    }

    if (orderStatuses) {
      params.OrderStatuses = orderStatuses.split(',');
    }

    if (marketplaceIds) {
      params.MarketplaceIds = marketplaceIds.split(',');
    }

    const result = await amazonSPService.getOrders(params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Orders route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/orders/:orderId
 * @desc Get specific order details
 * @access Private
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Get order from the orders list first
    const ordersResult = await amazonSPService.getOrders({
      OrderIds: [orderId]
    });

    if (!ordersResult.success) {
      return res.status(400).json({
        success: false,
        error: ordersResult.error,
        details: ordersResult.details
      });
    }

    const order = ordersResult.data.Orders?.[0];
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get additional order details
    const [itemsResult, buyerInfoResult, addressResult] = await Promise.allSettled([
      amazonSPService.getOrderItems(orderId),
      amazonSPService.getOrderBuyerInfo(orderId),
      amazonSPService.getOrderAddress(orderId)
    ]);

    const orderDetails = {
      ...order,
      items: itemsResult.status === 'fulfilled' && itemsResult.value.success 
        ? itemsResult.value.data 
        : null,
      buyerInfo: buyerInfoResult.status === 'fulfilled' && buyerInfoResult.value.success 
        ? buyerInfoResult.value.data 
        : null,
      address: addressResult.status === 'fulfilled' && addressResult.value.success 
        ? addressResult.value.data 
        : null
    };

    res.json({
      success: true,
      data: orderDetails
    });

  } catch (error) {
    console.error('Order details route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/orders/:orderId/items
 * @desc Get items for a specific order
 * @access Private
 */
router.get('/:orderId/items', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await amazonSPService.getOrderItems(orderId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Order items route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/orders/:orderId/buyer-info
 * @desc Get buyer information for a specific order
 * @access Private
 */
router.get('/:orderId/buyer-info', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await amazonSPService.getOrderBuyerInfo(orderId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Order buyer info route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/orders/:orderId/address
 * @desc Get shipping address for a specific order
 * @access Private
 */
router.get('/:orderId/address', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await amazonSPService.getOrderAddress(orderId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Order address route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router; 