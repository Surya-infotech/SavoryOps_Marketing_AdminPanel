import CircularProgress from '@mui/material/CircularProgress';
import '../../Scss/Custom/loadingspinner.scss';

const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <CircularProgress size={40} />
        </div>
    );
};

export default LoadingSpinner;
