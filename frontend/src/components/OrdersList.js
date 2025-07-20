import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import './OrdersList.css';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    orderStatuses: '',
    maxResults: 50,
    createdAfter: '',
    createdBefore: ''
  });
  const [pagination, setPagination] = useState({
    nextToken: null,
    hasMore: false
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (nextToken = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        ...filters,
        ...(nextToken && { nextToken })
      };

      const response = await ordersAPI.getOrders(params);
      
      if (response.data.success) {
        const newOrders = response.data.data.Orders || [];
        
        if (nextToken) {
          // Append to existing orders for pagination
          setOrders(prev => [...prev, ...newOrders]);
        } else {
          // Replace orders for new search
          setOrders(newOrders);
        }

        setPagination({
          nextToken: response.data.pagination?.nextToken || null,
          hasMore: response.data.pagination?.hasMore || false
        });
      } else {
        setError(response.data.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please check your authorization.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    loadOrders();
  };

  const handleLoadMore = () => {
    if (pagination.nextToken) {
      loadOrders(pagination.nextToken);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      orderStatuses: '',
      maxResults: 50,
      createdAfter: '',
      createdBefore: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount, currencyCode) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Shipped': 'success',
      'Unshipped': 'warning',
      'PartiallyShipped': 'info',
      'Canceled': 'danger',
      'Pending': 'secondary'
    };
    return statusColors[status] || 'secondary';
  };

  return (
    <div className="orders-list">
      <div className="orders-header">
        <h2>Amazon Orders</h2>
        <p>View and manage your Amazon seller orders</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="orderStatuses">Order Status</label>
            <select
              id="orderStatuses"
              value={filters.orderStatuses}
              onChange={(e) => handleFilterChange('orderStatuses', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Shipped">Shipped</option>
              <option value="Unshipped">Unshipped</option>
              <option value="PartiallyShipped">Partially Shipped</option>
              <option value="Canceled">Canceled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="maxResults">Max Results</label>
            <select
              id="maxResults"
              value={filters.maxResults}
              onChange={(e) => handleFilterChange('maxResults', parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="createdAfter">Created After</label>
            <input
              type="date"
              id="createdAfter"
              value={filters.createdAfter}
              onChange={(e) => handleFilterChange('createdAfter', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="createdBefore">Created Before</label>
            <input
              type="date"
              id="createdBefore"
              value={filters.createdBefore}
              onChange={(e) => handleFilterChange('createdBefore', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button 
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : '🔍 Search Orders'}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            🗑️ Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="message error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Orders List */}
      <div className="orders-content">
        {isLoading && orders.length === 0 ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No Orders Found</h3>
            <p>Try adjusting your filters or check your authorization status.</p>
          </div>
        ) : (
          <>
            <div className="orders-summary">
              <h3>Orders ({orders.length})</h3>
              {pagination.hasMore && (
                <span className="pagination-info">
                  More orders available
                </span>
              )}
            </div>

            <div className="orders-grid">
              {orders.map((order) => (
                <div key={order.AmazonOrderId} className="order-card">
                  <div className="order-header">
                    <h4>Order #{order.AmazonOrderId}</h4>
                    <span className={`status-badge ${getStatusColor(order.OrderStatus)}`}>
                      {order.OrderStatus}
                    </span>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="label">Purchase Date:</span>
                      <span className="value">{formatDate(order.PurchaseDate)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Last Updated:</span>
                      <span className="value">{formatDate(order.LastUpdateDate)}</span>
                    </div>

                    {order.OrderTotal && (
                      <div className="detail-row">
                        <span className="label">Total:</span>
                        <span className="value total">
                          {formatCurrency(order.OrderTotal.Amount, order.OrderTotal.CurrencyCode)}
                        </span>
                      </div>
                    )}

                    <div className="detail-row">
                      <span className="label">Fulfillment:</span>
                      <span className="value">{order.FulfillmentChannel}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Sales Channel:</span>
                      <span className="value">{order.SalesChannel}</span>
                    </div>

                    {order.ShipServiceLevel && (
                      <div className="detail-row">
                        <span className="label">Ship Service:</span>
                        <span className="value">{order.ShipServiceLevel}</span>
                      </div>
                    )}
                  </div>

                  <div className="order-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => window.open(`/api/v1/orders/${order.AmazonOrderId}`, '_blank')}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="load-more">
                <button 
                  className="btn btn-secondary"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : '📄 Load More Orders'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersList; 