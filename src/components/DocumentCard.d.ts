import React from 'react';
import { Document, User } from '../services/api';
type DocumentCardProps = {
    doc: Document;
    user: User | null;
    onClick: (id: number) => void;
    onClickMenu: (e: React.MouseEvent<HTMLElement>, doc: Document) => void;
    onClickShare: (e: React.MouseEvent<HTMLElement>) => void;
    onClickDelete: (e: React.MouseEvent<HTMLElement>) => void;
    isMenuOpen: boolean;
    onCloseMenu: () => void;
    anchorEl: HTMLElement | null;
};
declare const DocumentCard: React.FC<DocumentCardProps>;
export default DocumentCard;
