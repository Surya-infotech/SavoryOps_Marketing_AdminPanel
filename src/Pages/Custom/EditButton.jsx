import React from 'react';
import { Edit as EditIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useLanguage } from '../../Context/LanguageContext';

const EditButton = React.forwardRef(({ onClick, disabled = false, size = "small", ...props }, ref) => {
    const { translations } = useLanguage();

    return (
        <Tooltip title={translations.edit} arrow>
            <span ref={ref} {...props}>
                <IconButton
                    size={size}
                    onClick={onClick}
                    disabled={disabled}
                    aria-label={translations.edit}
                    className="edit-icon"
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
    );
});

EditButton.displayName = 'EditButton';

export default EditButton;
