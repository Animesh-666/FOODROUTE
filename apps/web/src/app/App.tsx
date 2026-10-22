import {lazy,Suspense,type ReactNode} from 'react';
import {BrowserRouter,Navigate,Route,Routes} from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import {AccountPage} from '../features/auth/AccountPage';
import {ForgotPasswordPage} from '../features/auth/ForgotPasswordPage';
import {LoginPage} from '../features/auth/LoginPage';
import {RegisterPage} from '../features/auth/RegisterPage';
import {RequireAuth} from '../features/auth/RequireAuth';
import {AuthProvider} from '../features/auth/AuthProvider';
import {RestaurantsPage} from '../features/restaurants/RestaurantsPage';
import {RestaurantMenuPage} from '../features/restaurants/RestaurantMenuPage';
import {RestaurantApplyPage} from '../features/restaurants/RestaurantApplyPage';
import {RestaurantDashboard as RestaurantMenuStudio} from '../features/restaurants/RestaurantDashboard';
import {AdminRestaurantApplications} from '../features/restaurants/AdminRestaurantApplications';
import {RequireRole} from '../features/restaurants/RequireRole';
import {LiveCartProvider} from '../features/orders/live-cart';
import {CheckoutPage} from '../features/orders/CheckoutPage';
import {CustomerOrdersPage} from '../features/orders/CustomerOrdersPage';
import {RestaurantOrdersPage} from '../features/orders/RestaurantOrdersPage';
import {RiderApplyPage} from '../features/dispatch/RiderApplyPage';
import {RiderDashboard as RiderDeliveryControls} from '../features/dispatch/RiderDashboard';
import {AdminDispatchPage} from '../features/dispatch/AdminDispatchPage';
import {OptimizedDispatchPage} from '../features/dispatch/OptimizedDispatchPage';
import {AlgorithmLabPage} from '../features/dispatch/AlgorithmLabPage';
import {RestaurantLocationPage} from '../features/location/RestaurantLocationPage';
import {DashboardShell} from '../features/dashboard/DashboardShell';
import {DashboardRedirect} from '../features/dashboard/DashboardRedirect';
import {BackToDashboard} from '../features/dashboard/BackToDashboard';
import {OrderAnalyticsPage,RiderHistoryPage} from '../features/insights/AnalyticsPages';
const CustomerDashboard=lazy(()=>import('../features/dashboard/CustomerDashboard').then(m=>({default:m.CustomerDashboard})));
const AdminOverview=lazy(()=>import('../features/dashboard/AdminOverview').then(m=>({default:m.AdminOverview})));
const RestaurantOverview=lazy(()=>import('../features/dashboard/RestaurantOverview').then(m=>({default:m.RestaurantOverview})));
const RiderOverview=lazy(()=>import('../features/dashboard/RiderOverview').then(m=>({default:m.RiderOverview})));
const RoadPlannerPage=lazy(()=>import('../features/road-planner/RoadPlannerPage').then(m=>({default:m.RoadPlannerPage})));
const LiveOrderRoutePage=lazy(()=>import('../features/road-planner/LiveOrderRoutePage').then(m=>({default:m.LiveOrderRoutePage})));
const loading=<div role="status" style={{padding:24}}>Loading workspace…</div>;
const defer=(element:ReactNode)=><Suspense fallback={loading}>{element}</Suspense>;
export default function App(){return <BrowserRouter><AuthProvider><LiveCartProvider><BackToDashboard/><Routes>
 <Route path="/" element={<LandingPage/>}/>
 <Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<RegisterPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
 <Route path="/restaurants" element={<RestaurantsPage/>}/><Route path="/restaurants/:restaurantId" element={<RestaurantMenuPage/>}/>
 <Route path="/algorithm-lab" element={<AlgorithmLabPage/>}/>
 <Route element={<RequireAuth/>}>
  <Route path="/dashboard" element={<DashboardRedirect/>}/>
  <Route path="/account" element={<AccountPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/orders" element={<CustomerOrdersPage/>}/>
  <Route path="/restaurant/apply" element={<RestaurantApplyPage/>}/><Route path="/rider/apply" element={<RiderApplyPage/>}/>
  <Route element={<RequireRole role="customer"/>}><Route element={<DashboardShell role="customer"/>}><Route path="/customer/dashboard" element={defer(<CustomerDashboard/>)}/><Route path="/customer/insights" element={<OrderAnalyticsPage scope="customer"/>}/></Route></Route>
  <Route element={<RequireRole role="restaurant"/>}>
   <Route element={<DashboardShell role="restaurant"/>}><Route path="/restaurant/dashboard" element={defer(<RestaurantOverview/>)}/><Route path="/restaurant/analytics" element={<OrderAnalyticsPage scope="restaurant"/>}/></Route>
   <Route path="/restaurant/menu" element={<RestaurantMenuStudio/>}/><Route path="/restaurant/orders" element={<RestaurantOrdersPage/>}/><Route path="/restaurant/location" element={<RestaurantLocationPage/>}/>
  </Route>
  <Route element={<RequireRole role="rider"/>}>
   <Route element={<DashboardShell role="rider"/>}><Route path="/rider/dashboard" element={defer(<RiderOverview/>)}/><Route path="/rider/history" element={<RiderHistoryPage/>}/></Route>
   <Route path="/rider/deliveries" element={<RiderDeliveryControls/>}/>
  </Route>
  <Route element={<RequireRole role="admin"/>}>
   <Route element={<DashboardShell role="admin"/>}><Route path="/admin/dashboard" element={defer(<AdminOverview/>)}/><Route path="/admin/analytics" element={<OrderAnalyticsPage scope="admin"/>}/></Route>
   <Route path="/admin/restaurant-applications" element={<AdminRestaurantApplications/>}/>
   <Route path="/admin/dispatch" element={<AdminDispatchPage/>}/><Route path="/admin/optimized-dispatch" element={<OptimizedDispatchPage/>}/>
   <Route path="/admin/route-planner" element={defer(<RoadPlannerPage/>)}/>
   <Route path="/admin/live-route-preview" element={defer(<LiveOrderRoutePage/>)}/>
  </Route>
 </Route>
 <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></LiveCartProvider></AuthProvider></BrowserRouter>}
