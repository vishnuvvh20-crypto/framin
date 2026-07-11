import { Config } from '../../core/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class ApiService {
  private static async getHeaders() {
    const isGuest = await AsyncStorage.getItem('farmin_guest_mode');
    const token = isGuest === 'true' ? 'guest-bypass-token' : ''; // In production, retrieve real JWT
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async post(endpoint: string, payload: any) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${Config.BACKEND_URL}/api/v1${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`API POST to ${endpoint} failed:`, error);
      throw error;
    }
  }

  static async get(endpoint: string) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${Config.BACKEND_URL}/api/v1${endpoint}`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`API GET from ${endpoint} failed:`, error);
      throw error;
    }
  }
}
