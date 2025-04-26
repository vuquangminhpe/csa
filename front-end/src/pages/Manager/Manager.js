import DashboardWrapper from "../../components/Manager/DashboardWrapper"
import HeaderDashboardComponent from "../../components/Manager/HeaderDashboard"
import NavbarDashboard from "../../components/Manager/NavbarDashboard"
import "./style.css";
const Manager = () => {

    return (
        <div>
            <DashboardWrapper>
                <NavbarDashboard />
                <HeaderDashboardComponent >
                 

                </HeaderDashboardComponent>
            </DashboardWrapper>
        </div>
    )
}
export default Manager;
