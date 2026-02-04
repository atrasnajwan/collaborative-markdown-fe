import React from "react";
type ShareDocumentModalProps = {
    open: boolean;
    onClose: () => void;
    documentId: number;
};
declare const ShareDocumentModal: React.FC<ShareDocumentModalProps>;
export default ShareDocumentModal;
