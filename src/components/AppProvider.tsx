import React from 'react';
import { App } from 'antd';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <App>{children}</App>;
};

export const useAppContext = App.useApp;