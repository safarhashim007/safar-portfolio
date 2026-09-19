import './contact.css'

export default function Contact() {
  return (
    <footer className="contact" id="contact">
      <div className="contact-top">
        <span className="readout">05 / Contact</span>
        <p className="contact-intro">A project, a question, or just a hello.</p>
        <h2 className="contact-title" data-reveal>
          <a className="contact-invitation" href="mailto:safarhashim7@gmail.com">Let&rsquo;s talk.<span className="contact-arrow" aria-hidden="true">↗</span></a>
        </h2>
      </div>

      <div className="contact-links">
        <a className="contact-link" href="mailto:safarhashim7@gmail.com">
          <span className="readout">Email</span>
          <span className="contact-link-value">safarhashim7@gmail.com</span>
        </a>

        <a
          className="contact-link"
          href="https://www.linkedin.com/in/muhammed-safar-h-52384b429?utm_source=share_via&utm_content=profile&utm_medium=member_android"
          target="_blank"
          rel="noreferrer"
        >
          <span className="readout">LinkedIn</span>
          <span className="contact-link-value">linkedin.com/in/muhammed-safar-h<span aria-hidden="true"> ↗</span></span>
        </a>

        <a
          className="contact-link"
          href="https://github.com/safarhashim007"
          target="_blank"
          rel="noreferrer"
        >
          <span className="readout">Code</span>
          <span className="contact-link-value">
            github.com/safarhashim007<span aria-hidden="true"> ↗</span>
          </span>
        </a>
      </div>

      <div className="contact-foot">
        <span className="readout">Safar Hashim © 2026</span>
        <span className="readout">Kochi, India</span>
        <a className="readout" href="#home">
          Back to top<span aria-hidden="true"> ↑</span>
        </a>
      </div>
    </footer>
  )
}
