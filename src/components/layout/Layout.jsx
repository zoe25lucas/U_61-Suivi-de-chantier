import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="content">
        {children}
      </main>
      <div className="footer-strip"></div>
    </div>
  );
};

export default Layout;
