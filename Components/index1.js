import NavBar from "./NavBar/NavBar"; // Ensure the path is correct
import Filter from "./Filter/Filter";
import Loader from "./Loader/Loader";
import Model from "./Model/Model";
import UserCard from "./UserCard/UserCard";
import Friend from "./Friend/Friend";

// Fix import conflict with Next.js built-in Error component
import ErrorComponent from "./Error/Error"; 

export { NavBar, Filter, ErrorComponent as Error, Loader, Model, UserCard, Friend };
