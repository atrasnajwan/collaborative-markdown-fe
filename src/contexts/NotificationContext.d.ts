import React from 'react';
import { AlertColor } from '@mui/material';
interface NotificationContextType {
    showNotification: (message: any, severity?: AlertColor, autoHide?: boolean) => void;
}
export declare const NotificationProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useNotification: () => NotificationContextType;
export {};
