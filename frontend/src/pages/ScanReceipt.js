import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Camera, Check } from 'lucide-react';
import config from '../config';

function ScanReceipt() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    // Fetch categories when component mounts
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}${config.endpoints.categories}`);
        setCategories(response.data.filter(cat => cat.name !== 'Uncategorized'));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${config.apiUrl}${config.endpoints.scanReceipt}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Scan response:', response.data);
      setResult(response.data);
      
      // Handle different response structures
      setFormData({
        amount: response.data.amount?.toString() || '0.01',
        category_id: '',
        description: response.data.description || 'Receipt scan',
        date: response.data.date || new Date().toISOString().split('T')[0],
      });
      
      alert('Receipt scanned successfully! Please review the details.');
    } catch (error) {
      console.error('Error scanning receipt:', error);
      alert('Error scanning receipt. The receipt was saved but could not be processed automatically. Please enter the details manually.');
      
      // Still allow manual entry even if scan fails
      setResult({ manual: true });
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      };
      
      await axios.post(`${config.apiUrl}${config.endpoints.expenses}`, expenseData);
      setFile(null);
      setPreview(null);
      setResult(null);
      setFormData({
        amount: '',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Scan Receipt</h2>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 object-contain" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {file && (
            <div className="flex justify-center">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="btn-primary inline-flex items-center"
              >
                {scanning ? (
                  <>
                    <Camera className="h-5 w-5 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 mr-2" />
                    Scan Receipt
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Information</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="input-field mt-1"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary inline-flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ScanReceipt; 