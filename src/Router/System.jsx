import { Route, Routes } from "react-router-dom";
import Setting from "../Pages/System/Setting";
import AddFiscalYear from "../Components/System/Setting/AddFiscalYear";
import EditFiscalYear from "../Components/System/Setting/EditFiscalYear";
import PageNotFound from "../Pages/Partials/PageNotFound";

const SystemRouter = () => (
    <Routes>
        <Route path="/Setting" element={<Setting />} />
        <Route path="/Setting/AddFiscalYear" element={<AddFiscalYear />} />
        <Route path="/Setting/EditFiscalYear/:id" element={<EditFiscalYear />} />
        <Route path="*" element={<PageNotFound />} />
    </Routes>
);

export default SystemRouter;
