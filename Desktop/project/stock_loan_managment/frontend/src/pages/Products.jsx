import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Check, X, AlertTriangle } from 'lucide-react';

const Products = () => {
  const { token, user, API_URL } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');

  // Form states for adding product
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // States for inline editing product price
  const [editingId, setEditingId] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) {
      setFeedback('Please specify product name and price.');
      setFeedbackType('danger');
      return;
    }

    setAddLoading(true);
    setFeedback('');

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: newProductName,
          pricePerUnit: parseFloat(newProductPrice),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback('Product added successfully!');
        setFeedbackType('success');
        setNewProductName('');
        setNewProductPrice('');
        setShowAddForm(false);
        fetchProducts();
      } else {
        setFeedback(data.message || 'Failed to add product.');
        setFeedbackType('danger');
      }
    } catch (err) {
      setFeedback('Server error.');
      setFeedbackType('danger');
    } finally {
      setAddLoading(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setEditingPrice(product.pricePerUnit.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingPrice('');
  };

  const handleUpdatePrice = async (productId) => {
    if (!editingPrice || parseFloat(editingPrice) < 0) {
      alert('Price must be a positive number');
      return;
    }

    setEditLoading(true);
    setFeedback('');

    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pricePerUnit: parseFloat(editingPrice),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback('Product price updated successfully.');
        setFeedbackType('success');
        setEditingId(null);
        fetchProducts();
      } else {
        setFeedback(data.message || 'Failed to update price.');
        setFeedbackType('danger');
      }
    } catch (err) {
      setFeedback('Server error.');
      setFeedbackType('danger');
    } finally {
      setEditLoading(false);
    }
  };

  const isEditable = user.role === 'admin' || user.role === 'manager';

  if (loading) return <div style={loaderStyle}>Loading Products...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Catalog</h1>
          <p className="page-subtitle">Configure system product types and pricing levels.</p>
        </div>
        {isEditable && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary no-print">
            {showAddForm ? <X size={18} /> : <Plus size={18} />}
            <span>{showAddForm ? 'Cancel' : 'New Product'}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedbackType}`}>
          {feedbackType === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback}</span>
        </div>
      )}

      {/* Add Product Form */}
      {showAddForm && (
        <div className="glass-card glow-primary" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Add New Product</h3>
          <form onSubmit={handleAddProduct}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                placeholder="e.g. Maize, Beans, Rice"
                className="form-control"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price Per Unit ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 1.50"
                className="form-control"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="glass-card">
        {products.length === 0 ? (
          <div style={emptyStateStyle}>No products found in the catalog.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Price Per Unit ($)</th>
                  {isEditable && <th className="no-print" style={{ textAlign: 'right', width: '150px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p._id}</td>
                    <td style={{ fontWeight: '600' }}>{p.productName}</td>
                    <td>
                      {editingId === p._id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control"
                            style={{ width: '100px', padding: '0.4rem' }}
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            disabled={editLoading}
                          />
                        </div>
                      ) : (
                        <strong style={{ color: 'var(--color-success)' }}>${p.pricePerUnit.toFixed(2)}</strong>
                      )}
                    </td>
                    {isEditable && (
                      <td className="no-print" style={{ textAlign: 'right' }}>
                        {editingId === p._id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleUpdatePrice(p._id)}
                              className="btn btn-success"
                              style={{ padding: '0.4rem 0.6rem' }}
                              disabled={editLoading}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.6rem' }}
                              disabled={editLoading}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            <Edit2 size={14} />
                            <span>Edit Price</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const loaderStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '80vh',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'var(--text-muted)',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: 'var(--text-muted)',
  background: 'rgba(255, 255, 255, 0.01)',
  borderRadius: '12px',
  border: '1px dashed var(--border-light)',
};

export default Products;
