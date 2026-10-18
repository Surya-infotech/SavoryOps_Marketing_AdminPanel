import { FormControl, FormControlLabel, Switch } from '@mui/material';

const CustomSwitch = ({ checked, onChange, disabled = false }) => {
    return (
        <FormControl>
            <FormControlLabel
                control={
                    <Switch
                        checked={checked}
                        onChange={onChange}
                        disabled={disabled}
                        sx={{
                            '& .MuiSwitch-switchBase': { color: '#fff' },
                            '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--primary-color)' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--primary-color)' },
                        }}
                    />
                }
                label=""
            />
        </FormControl>
    );
};

export default CustomSwitch;