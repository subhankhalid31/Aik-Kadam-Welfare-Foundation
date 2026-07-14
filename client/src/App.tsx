import { Switch, Route } from "wouter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/lib/auth-context";
import { DialogProvider } from "@/lib/dialog-context";
import Home from "@/pages/home";
import About from "@/pages/about";
import Volunteers from "@/pages/volunteers";
import VolunteerRegister from "@/pages/volunteer-register";
import CompletedProjects from "@/pages/completed-projects";
import ProjectMap from "@/pages/project-map";
import SuccessStories from "@/pages/success-stories";
import OngoingProjects from "@/pages/ongoing-projects";
import PostCase from "@/pages/post-case";
import Contact from "@/pages/contact";
import Partner from "@/pages/partner";
import Help from "@/pages/help";
import Verify from "@/pages/verify";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import VerifyOtp from "@/pages/verify-otp";
import ForgotPassword from "@/pages/forgot-password";
import Admin from "@/pages/admin";
import AdminGalleryNew from "@/pages/admin/gallery-new";
import AdminSuccessStoryNew from "@/pages/admin/success-story-new";
import Account from "@/pages/account";
import AccountSettings from "@/pages/account-settings";
import Donate from "@/pages/donate";
import MyDonations from "@/pages/my-donations";

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/volunteers" component={Volunteers} />
        <Route path="/volunteers/register" component={VolunteerRegister} />
        <Route path="/completed-projects" component={CompletedProjects} />
        <Route path="/project-map" component={ProjectMap} />
        <Route path="/success-stories" component={SuccessStories} />
        <Route path="/ongoing-projects" component={OngoingProjects} />
        <Route path="/post-case" component={PostCase} />
        <Route path="/contact" component={Contact} />
        <Route path="/partner" component={Partner} />
        <Route path="/help" component={Help} />
        <Route path="/verify/:badgeId" component={Verify} />
        <Route path="/verify" component={Verify} />
        <Route path="/signup" component={Signup} />
        <Route path="/login" component={Login} />
        <Route path="/verify-otp" component={VerifyOtp} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/gallery/new" component={AdminGalleryNew} />
        <Route path="/admin/success-stories/new" component={AdminSuccessStoryNew} />
        <Route path="/account" component={Account} />
        <Route path="/account/settings" component={AccountSettings} />
        <Route path="/donate" component={Donate} />
        <Route path="/my-donations" component={MyDonations} />
        <Route>
          <div className="min-h-screen flex items-center justify-center font-display text-2xl">
            Page not found
          </div>
        </Route>
      </Switch>
      </DialogProvider>
    </AuthProvider>
  );
}
