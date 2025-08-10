// src/pages/ReferralDashboard.jsx
import React from 'react';
import Layout from '../Layout';
import Header from '../components/header/v1/Header';
import Footer from '../sections/footer/Footer';
import ReferralDashboardSection from '../sections/referralDashboard/ReferralDashboard';
import MockReferralTester from '../components/MockReferralTester';

const ReferralDashboard = () => {
  return (
    <Layout pageTitle="Referral Dashboard - Make America Great Again">
      <Header variant="v5" />
      <ReferralDashboardSection />
      
      {/* Mock Referral Testing Tool */}
      <div className="container">
        <div className="row">
          <div className="col-12">
            <MockReferralTester />
          </div>
        </div>
      </div>
      
      <Footer variant="v1" />
    </Layout>
  );
};

export default ReferralDashboard;