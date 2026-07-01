// Shared hook for use employees data.
import { useState, useEffect, useCallback } from 'react';
import { fetchEmployees, createEmployee, deleteEmployee, updateEmployee } from '../services/api';
import toast from 'react-hot-toast';

// Provides employees.
export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Gets employees data.
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEmployees();
      setEmployees(data);
      toast.success(`Loaded ${data.length} employees`);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  // Prepares retry.
  const retry = () => {
    setRetryCount(prev => prev + 1);
    loadEmployees();
  };

  // Saves employee data.
  const addEmployee = async (employeeData) => {
    try {
      const newEmployee = await createEmployee(employeeData);
      setEmployees(prev => [newEmployee, ...prev]);
      toast.success('Employee added successfully');
      return newEmployee;
    } catch (err) {
      toast.error('Failed to add employee');
      throw err;
    }
  };

  // Updates employee data.
  const editEmployee = async (id, employeeData) => {
    try {
      const updated = await updateEmployee(id, employeeData);
      setEmployees(prev => prev.map(emp => emp.id === id ? updated : emp));
      toast.success('Employee updated successfully');
      return updated;
    } catch (err) {
      toast.error('Failed to update employee');
      throw err;
    }
  };

  // Removes employee data.
  const removeEmployee = async (id) => {
    try {
      await deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast.success('Employee deleted successfully');
    } catch (err) {
      toast.error('Failed to delete employee');
      throw err;
    }
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees, retryCount]);

  return {
    employees,
    loading,
    error,
    retry,
    addEmployee,
    editEmployee,
    removeEmployee,
    reload: loadEmployees,
  };
};