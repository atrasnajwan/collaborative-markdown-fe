type DeleteDialogProps = {
    open: boolean;
    description: string;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
};
declare const DeleteDialog: React.FC<DeleteDialogProps>;
export default DeleteDialog;
