import * as Yup from 'yup';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class OrderController {
  async index(req, res) {
    const { page = 1, q = '' } = req.query;

    const orders = await Order.findAll({
      where: {
        canceled_at: null,
        product: {
          [Op.iLike]: `%${q}%`,
        },
      },
      attributes: ['id', 'product', 'signature_id', 'canceled_at', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'name', 'street', 'number', 'complement', 'city', 'state', 'zip_code'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'url', 'path'],
        }
      ],
    });

    return res.json(orders);
  }

  async show(req, res) {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
			attributes: ['id', 'product'],
			include: [
				{
					model: Recipient,
					as: 'recipient',
					attributes: ['id', 'name'],
				},
				{
					model: Deliveryman,
					as: 'deliveryman',
					attributes: ['id', 'name'],
				},
			],
		});

		if (!order) {
			return res.status(400).json({ error: 'Order does not exists' });
		}

    return res.json(order);
  }

  async store(req, res) {
    /**
     * Validation
     */
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }

    /**
     * Check if Recipient and Deliveryman exists
     */
    const { recipient_id, deliveryman_id } = req.body;

    const recipientExists = await Recipient.findByPk(recipient_id);

    const deliverymanExists = await Deliveryman.findByPk(deliveryman_id);

    if (!recipientExists || !deliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Recipient or deliveryman not found!' });
    }

    const { product } = await Order.create(req.body);

    return res.json({
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  async update(req, res) {
    /**
     * Validation
     */
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }

    /**
     * Check if Recipient and Deliveryman exists
     */
    const { recipient_id, deliveryman_id } = req.body;

    const recipientExists = await Recipient.findByPk(recipient_id);

    const deliverymanExists = await Deliveryman.findByPk(deliveryman_id);

    if (!recipientExists || !deliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Recipient or deliveryman not found!' });
    }

    const order = await Order.findByPk(req.params.id);

    const { id, product } = await order.update(req.body);

    return res.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id);

    /**
     * Check if order exists
     */
    if (!order) {
      return res.status(400).json({ error: 'Order not found!' });
    }

    /**
     * Check if order was not canceled
     */
    if (order.canceled_at !== null) {
      return res
        .status(401)
        .json({ error: `This order was canceled at ${order.canceled_at}` });
    }

    order.canceled_at = new Date();

    await order.save();

    return res.json(order);
  }
}

export default new OrderController();
