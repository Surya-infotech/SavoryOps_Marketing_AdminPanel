import { Route, Routes } from "react-router-dom";
import ContactUs from "../Pages/Support/ContactUs";
import Subscribers from "../Pages/Support/Subscribers";
import PageNotFound from "../Pages/Partials/PageNotFound";

const SupportRouter = () => (
    <Routes>
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/Subscribers" element={<Subscribers />} />
        <Route path="*" element={<PageNotFound />} />
    </Routes>
);

export default SupportRouter;
