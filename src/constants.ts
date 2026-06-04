/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, UserProfile, StockData } from './types';

export const USER_DATA: UserProfile = {
  surname: "",
  middleName: "",
  lastName: "",
  username: "",
  email: "",
  pin: "",
  dob: "",
  phone: "",
  country: "",
  state: "",
  city: "",
  balance: 0,
  gender: "",
  occupation: "",
  address: "",
  accountNumber: "",
  branchCode: "",
  password: ""
};

export const TRANSACTIONS: Transaction[] = [];

export const STOCKS: StockData[] = [
  { symbol: "AAPL", name: "Apple", price: 300.23, change: 0.68 },
  { symbol: "TSLA", name: "Tesla", price: 422.24, change: -4.75 },
  { symbol: "NVDA", name: "NVIDIA", price: 225.32, change: -4.42 }
];

export const ACTIVITY_DATA = [
  { name: 'Mon', value: 25 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 35 },
  { name: 'Thu', value: 70 },
  { name: 'Fri', value: 45 },
  { name: 'Sat', value: 62 },
  { name: 'Sun', value: 55 },
];

export const PROFILE_IMAGE = "https://res.cloudinary.com/dcksy6lcp/image/upload/v1/1b2dd907c73ce868394daa1202865cbf.jpg";
