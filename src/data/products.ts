import type { Product } from '../types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Ordinateur Gaming Pro',
    price: 1299,
    description: 'PC Gaming haute performance avec composants premium',
    image: 'https://images.pexels.com/photos/2399840/pexels-photo-2399840.jpeg',
    category: 'Gaming',
    model3d: '/models/gaming-pc.babylon',
    parts: [
      {
        id: 'cpu-1',
        name: 'Processeur Intel i7-13700K',
        price: 399,
        description: 'Processeur haute performance 16 cœurs',
        image: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg',
        inStock: true,
        groupId: 'cpu-group'
      },
      {
        id: 'gpu-1',
        name: 'RTX 4070 Ti',
        price: 799,
        description: 'Carte graphique gaming premium',
        image: 'https://images.pexels.com/photos/442154/pexels-photo-442154.jpeg',
        inStock: true,
        groupId: 'gpu-group'
      },
      {
        id: 'ram-1',
        name: 'DDR5 32GB 5600MHz',
        price: 299,
        description: 'Mémoire RAM haute vitesse',
        image: 'https://images.pexels.com/photos/163127/electronics-circuit-board-computer-163127.jpeg',
        inStock: true,
        groupId: 'memory-group'
      }
    ],
    partGroups: [
      {
        id: 'cpu-group',
        name: 'Processeurs',
        description: 'Choisissez votre processeur',
        parts: ['cpu-1']
      },
      {
        id: 'gpu-group',
        name: 'Cartes Graphiques',
        description: 'Cartes graphiques disponibles',
        parts: ['gpu-1']
      },
      {
        id: 'memory-group',
        name: 'Mémoire',
        description: 'Options de mémoire RAM',
        parts: ['ram-1']
      }
    ],
    options: [
      {
        id: 'warranty-1',
        name: 'Garantie Étendue',
        value: '3 ans',
        priceModifier: 99,
        description: 'Garantie étendue 3 ans',
        groupId: 'warranty-group'
      },
      {
        id: 'assembly-1',
        name: 'Assemblage Premium',
        value: 'Inclus',
        priceModifier: 149,
        description: 'Assemblage professionnel avec tests',
        groupId: 'service-group'
      },
      {
        id: 'rgb-1',
        name: 'Éclairage RGB',
        value: 'Activé',
        priceModifier: 79,
        description: 'Kit éclairage RGB synchronisé',
        groupId: 'visual-group'
      }
    ],
    optionGroups: [
      {
        id: 'warranty-group',
        name: 'Garantie',
        description: 'Options de garantie',
        type: 'single',
        options: ['warranty-1']
      },
      {
        id: 'service-group',
        name: 'Services',
        description: 'Services additionnels',
        type: 'multiple',
        options: ['assembly-1']
      },
      {
        id: 'visual-group',
        name: 'Personnalisation',
        description: 'Options esthétiques',
        type: 'multiple',
        options: ['rgb-1']
      }
    ]
  },
  {
    id: '2',
    name: 'Smartphone Premium',
    price: 999,
    description: 'Smartphone dernière génération avec appareil photo professionnel',
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
    category: 'Mobile',
    parts: [
      {
        id: 'screen-1',
        name: 'Écran OLED 6.7"',
        price: 299,
        description: 'Écran OLED haute résolution',
        image: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg',
        inStock: true,
        groupId: 'display-group'
      },
      {
        id: 'battery-1',
        name: 'Batterie 5000mAh',
        price: 89,
        description: 'Batterie longue durée',
        image: 'https://images.pexels.com/photos/4068314/pexels-photo-4068314.jpeg',
        inStock: true,
        groupId: 'power-group'
      }
    ],
    partGroups: [
      {
        id: 'display-group',
        name: 'Écrans',
        description: 'Options d\'écran',
        parts: ['screen-1']
      },
      {
        id: 'power-group',
        name: 'Alimentation',
        description: 'Batteries disponibles',
        parts: ['battery-1']
      }
    ],
    options: [
      {
        id: 'color-1',
        name: 'Couleur',
        value: 'Noir Profond',
        priceModifier: 0,
        description: 'Couleur du châssis',
        groupId: 'appearance-group'
      },
      {
        id: 'storage-1',
        name: 'Stockage',
        value: '256GB',
        priceModifier: 0,
        description: 'Capacité de stockage',
        groupId: 'storage-group'
      }
    ],
    optionGroups: [
      {
        id: 'appearance-group',
        name: 'Apparence',
        description: 'Personnalisation visuelle',
        type: 'single',
        options: ['color-1']
      },
      {
        id: 'storage-group',
        name: 'Stockage',
        description: 'Capacité de stockage',
        type: 'single',
        options: ['storage-1']
      }
    ]
  }
];