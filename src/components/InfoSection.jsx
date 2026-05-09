import { motion } from 'framer-motion';

const features = [
  {
    title: "Zaznamenejte každý detail",
    description: "Přidejte fotky, lokace a poznámky k vašim výletům. Mějte všechny vzpomínky bezpečně uložené na jednom místě.",
    icon: "🗺️"
  },
  {
    title: "Sdílejte s přáteli",
    description: "Inspirujte ostatní svými cestami nebo plánujte společná dobrodružství. Komunita cestovatelů na dosah ruky.",
    icon: "🤝"
  },
  {
    title: "Statistiky a mapa",
    description: "Sledujte, kolik míst jste už navštívili. Vaše osobní mapa se bude postupně plnit podle vašich cest.",
    icon: "📍"
  }
];

const InfoSection = () => {
  return (
    <section id="features" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Vše co potřebujete pro <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              dokonalý přehled
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Aplikace byla navržena s ohledem na jednoduchost a krásný design. Zaznamenat výlet nebylo nikdy jednodušší.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors"
            >
              <div className="text-4xl mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
