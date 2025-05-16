import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import config from '../config';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  // Filtering state
  const [yearFilter, setYearFilter] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [totalExpensesCount, setTotalExpensesCount] = useState(0);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...expenses];
    
    // Apply year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(expense => 
        new Date(expense.date).getFullYear() === parseInt(yearFilter)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Set filtered expenses
    setFilteredExpenses(filtered);
    setTotalExpensesCount(filtered.length);
    
    // Update total pages
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [expenses, itemsPerPage, yearFilter]);

  useEffect(() => {
    // Extract available years from expenses
    if (expenses.length > 0) {
      const years = Array.from(
        new Set(expenses.map(expense => new Date(expense.date).getFullYear()))
      ).sort((a, b) => b - a); // Sort years in descending order
      setAvailableYears(years);
    }
  }, [expenses]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      // Request all expenses by specifying a large limit
      const response = await axios.get(`${config.apiUrl}${config.endpoints.expenses}?limit=10000`);
      console.log(`Loaded ${response.data.length} expenses from API`);
      setExpenses(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}${config.endpoints.categories}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      
      if (editingExpense) {
        await axios.put(`${config.apiUrl}${config.endpoints.expenses}/${editingExpense.id}`, expenseData);
      } else {
        await axios.post(`${config.apiUrl}${config.endpoints.expenses}`, expenseData);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      setFormData({
        amount: '',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense. Please try again.');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category_id: expense.category ? expense.category.id.toString() : '',
      description: expense.description,
      date: expense.date,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`${config.apiUrl}${config.endpoints.expenses}/${id}`);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  // Navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
  };

  // Handle year filter change
  const handleYearFilterChange = (e) => {
    setYearFilter(e.target.value);
  };

  // Get current expenses
  const indexOfLastExpense = currentPage * itemsPerPage;
  const indexOfFirstExpense = indexOfLastExpense - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstExpense, indexOfLastExpense);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
        <div className="flex flex-wrap items-center gap-4">
          {/* Year Filter */}
          <div className="flex items-center">
            <label htmlFor="yearFilter" className="mr-2 text-sm text-gray-600">Year:</label>
            <select
              id="yearFilter"
              value={yearFilter}
              onChange={handleYearFilterChange}
              className="border border-gray-300 rounded-md py-1 px-2 text-sm"
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Items Per Page */}
          <div className="flex items-center">
            <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-600">Show:</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded-md py-1 px-2 text-sm"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>All</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-pulse text-gray-500">Loading expenses...</div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-lg p-6 text-center text-gray-500">
          {expenses.length === 0 ? (
            "No expenses found. Add your first expense using the 'Add Expense' button."
          ) : (
            "No expenses match your current filters. Try changing your filter settings."
          )}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 py-2 px-4 text-sm text-gray-500">
              Showing {filteredExpenses.length} of {expenses.length} total expenses (newest first)
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.category ? expense.category.name : 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm border border-gray-200 sm:px-6 rounded-lg">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <span className="mx-2 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstExpense + 1}</span> to{' '}
                    <span className="font-medium">
                      {indexOfLastExpense > filteredExpenses.length ? filteredExpenses.length : indexOfLastExpense}
                    </span>{' '}
                    of <span className="font-medium">{filteredExpenses.length}</span> expenses
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page numbers */}
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h3>
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
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select a category</option>
                  {categories.filter(cat => cat.name !== 'Uncategorized').map((category) => (
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
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                    setFormData({
                      amount: '',
                      category_id: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingExpense ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses; 