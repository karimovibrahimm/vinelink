import './Testimonials.css'

const testimonials = [
  {
    name: 'Sofia Reyes',
    handle: '@sofiareyes.co',
    avatar: 'S',
    color: '#e8b4b8',
    text: 'I switched from Linktree to Vinelink and never looked back. My page looks so much more professional and my click rate went up by 40%. The templates are stunning.',
    role: 'Fashion Creator • 82K followers'
  },
  {
    name: 'Marcus Allen',
    handle: '@marcusallen',
    avatar: 'M',
    color: '#b4d4e8',
    text: 'Finally a link-in-bio tool that does not look generic. My audience actually compliments my Vinelink page. And at $4/mo I was paying way too much for Linktree before.',
    role: 'Fitness Coach • 45K followers'
  },
  {
    name: 'Jade Kim',
    handle: '@jadekimstudio',
    avatar: 'J',
    color: '#b4e8c4',
    text: 'Setup took literally 2 minutes. The analytics show me exactly which links my audience clicks most so I can optimize my content strategy. This is the real deal.',
    role: 'Digital Artist • 120K followers'
  }
]

function Testimonials() {
  return (
    <section className="testimonials" id="examples">
      <div className="testimonials__container">

        <div className="testimonials__header">
          <div className="testimonials__badge">Testimonials</div>
          <h2 className="testimonials__title">Creators love Vinelink.</h2>
          <p className="testimonials__subtitle">
            Join thousands of creators who already made the switch.
          </p>
        </div>

        <div className="testimonials__grid">
          {testimonials.map((t, index) => (
            <div className="testimonials__card" key={index}>
              <div className="testimonials__stars">★★★★★</div>
              <p className="testimonials__text">"{t.text}"</p>
              <div className="testimonials__author">
                <div
                  className="testimonials__avatar"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div className="testimonials__info">
                  <div className="testimonials__name">{t.name}</div>
                  <div className="testimonials__handle">{t.handle}</div>
                  <div className="testimonials__role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Testimonials