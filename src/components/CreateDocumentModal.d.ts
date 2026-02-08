import React from 'react'
type CreateDocumentModalProps = {
  open: boolean
  handleCreateDocument: (e: React.FormEvent, title: string) => Promise<void>
  onClose: () => {}
}
declare const CreateDocumentModal: React.FC<CreateDocumentModalProps>
export default CreateDocumentModal
