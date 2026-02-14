import React from 'react';
import { AlertColor } from '@mui/material';
type ShareDocumentModalProps = {
    open: boolean;
    onClose: () => void;
    documentId: number;
    onNotification: (message: any, severity?: AlertColor) => void;
};
declare const ShareDocumentModal: React.FC<ShareDocumentModalProps>;
export default ShareDocumentModal;
