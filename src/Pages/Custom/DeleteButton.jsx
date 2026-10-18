import React from 'react';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useLanguage } from '../../Context/LanguageContext';

const DeleteButton = React.forwardRef(({ onClick, disabled = false, size = "small", ...props }, ref) => {
    const { translations } = useLanguage();

    return (
        <Tooltip title={translations.delete} arrow>
            <span ref={ref} {...props}>
                <IconButton
                    size={size}
                    onClick={onClick}
                    disabled={disabled}
                    aria-label={translations.delete}
                    className="delete-icon"
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
    );
});

DeleteButton.displayName = 'DeleteButton';

export default DeleteButton;