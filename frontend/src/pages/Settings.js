import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import config from '../config';

function Settings() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}${config.endpoints.categories}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await axios.post(`${config.apiUrl}${config.endpoints.categories}`, { name: newCategory });
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`${config.apiUrl}${config.endpoints.categories}/${id}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get('http://localhost:8000/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses-data.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        await axios.post('http://localhost:8000/import', data);
        alert('Data imported successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please try again.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
        <form onSubmit={handleAddCategory} className="flex space-x-4 mb-6">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add
          </button>
        </form>

        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-700">{category.name}</span>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn-primary inline-flex items-center w-full justify-center"
            >
              <Download className="h-5 w-5 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
          <div>
            <label className="btn-secondary inline-flex items-center w-full justify-center cursor-pointer">
              <Upload className="h-5 w-5 mr-2" />
              {isImporting ? 'Importing...' : 'Import Data'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
        <p className="text-gray-600">
          This is a personal expenses tracker application that helps you manage your
          expenses, scan receipts, and analyze your spending patterns. The application
          uses OCR technology to extract information from receipts and provides
          insights to help you optimize your spending.
        </p>
      </div>
    </div>
  );
}

export default Settings; 